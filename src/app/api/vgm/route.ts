import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vgmNumber = searchParams.get('vgmNumber');

  if (!vgmNumber) {
    return NextResponse.json({ error: 'Delivery Number (vbeln) is required' }, { status: 400 });
  }

  const sapUrl = process.env.SAP_API_URL;
  const sapUser = process.env.SAP_USERNAME;
  const sapPass = process.env.SAP_PASSWORD;

  // Verify if credentials are configured
  const isConfigured =
    sapUrl &&
    sapUrl !== 'https://your-sap-gateway-host:port/sap/opu/odata/sap/ZVGM_DETAILS_SRV/VgmSet' &&
    sapUser &&
    sapUser !== 'your_sap_username' &&
    sapPass &&
    sapPass !== 'your_sap_password';

  // Format delivery number to standard SAP 10-digit format if it's purely numeric
  const formattedVbeln = /^\d+$/.test(vgmNumber.trim()) 
    ? vgmNumber.trim().padStart(10, '0') 
    : vgmNumber.trim();

  if (!isConfigured) {
    // Sandbox Mock Mode fallback
    console.log(`[API Route] Sandbox Mock Mode active for Delivery VBELN: ${formattedVbeln}`);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const hash = Array.from(formattedVbeln).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const slipNo = (1100 + (hash % 100)).toString();
    const grossWeight = 20160;
    const tareWeight = 2300;
    const vgmWeight = grossWeight + tareWeight;

    return NextResponse.json({
      deliveryNo: formattedVbeln,
      material: 'DES -Export Drum MS (Sandbox)',
      exportInvoiceNo: `PEX/100${300 + (hash % 10)}/26-27`,
      bookingNo: `98951${300 + (hash % 100)}`,
      shipperName: 'AARTI PHARMALABS LTD',
      shipperLicenseNo: 'AASCA9722G',
      authorizedOfficial: 'Kinjal Vikam Export Logistic Head',
      contactDetails: '9324005790',
      containerNo: `UACU${4000000 + (hash * 17) % 999999}`,
      containerSize: '20 BOX',
      maxPermissibleWeight: 30480,
      weighbridgeAddress: '474281 AARTI PHARMALAB LIMITED - UNIT VI',
      weighingMethod: 'METHOD-1',
      grossWeight: grossWeight,
      tareWeight: tareWeight,
      vgmWeight: vgmWeight,
      weighingDateTime: '20260617114000',
      weighingSlipNo: slipNo,
      containerType: 'Hazardous',
      hazardousDetails: '1594/6.1/II',
      mode: 'MOCK_DATA',
      vgmNumber: vgmNumber.toUpperCase()
    });
  }

  try {
    const authHeader = `Basic ${Buffer.from(`${sapUser}:${sapPass}`).toString('base64')}`;
    
    // S4/HANA Cloud OData V4 format: filter by vbeln
    const requestUrl = `${sapUrl}?$filter=vbeln eq '${encodeURIComponent(formattedVbeln)}'`;

    console.log(`[API Route] Fetching from S/4HANA OData: ${requestUrl}`);

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      next: { revalidate: 15 } // cache records for 15s
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Route] SAP error status ${response.status}: ${errorText}`);
      return NextResponse.json(
        { error: `SAP Cloud Error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const records = data.value;

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: `Delivery Number (VBELN) '${formattedVbeln}' not found in SAP.` },
        { status: 404 }
      );
    }

    const record = records[0];

    // Combine datum (YYYY-MM-DD) and uzeit (HH:MM:SS) to match YYYYMMDDHHMMSS format in PDF
    let weighingDateStr = 'N/A';
    if (record.datum && record.uzeit) {
      const rawDate = record.datum.replace(/-/g, ''); // 2026-06-17 -> 20260617
      const rawTime = record.uzeit.replace(/:/g, ''); // 11:40:00 -> 114000
      weighingDateStr = `${rawDate}${rawTime}`;
    } else if (record.datum) {
      weighingDateStr = record.datum.replace(/-/g, '');
    }

    // Map the OData weighing method code (e.g. "01") to text representation
    let weighingMethodStr = record.zweighing_m || 'METHOD-1';
    if (weighingMethodStr === '01') {
      weighingMethodStr = 'METHOD-1';
    } else if (weighingMethodStr === '02') {
      weighingMethodStr = 'METHOD-2';
    }

    return NextResponse.json({
      deliveryNo: record.vbeln ? record.vbeln.padStart(10, '0') : formattedVbeln,
      material: record.ProductName || record.Product || 'N/A',
      exportInvoiceNo: record.comminvno || 'N/A',
      bookingNo: record.zbookon || 'N/A',
      shipperName: record.znofshpcode || 'AARTI PHARMALABS LTD',
      shipperLicenseNo: record.zshpreg || 'AASCA9722G',
      authorizedOfficial: record.zndosusd || 'N/A',
      contactDetails: record.z24x7cnt || 'N/A',
      containerNo: record.zzcontainer_id || 'N/A',
      containerSize: record.zcontr_size || 'N/A',
      maxPermissibleWeight: record.zmpwoc_csc || '30480',
      weighbridgeAddress: record.zwb_reg || 'N/A',
      weighingMethod: weighingMethodStr,
      grossWeight: record.zgnp_wght || '0',
      tareWeight: record.ztare_wght || '0',
      vgmWeight: record.zvgm || '0',
      weighingDateTime: weighingDateStr,
      weighingSlipNo: record.zw_slip_no || 'N/A',
      containerType: record.zvgm_type || 'Normal',
      hazardousDetails: record.zvgm_type_d || 'N/A',
      mode: 'LIVE_SAP',
      vgmNumber: vgmNumber.toUpperCase()
    });

  } catch (error: any) {
    console.error('[API Route] SAP OData Connectivity Error:', error);
    return NextResponse.json(
      { error: `Connection failed: ${error.message || 'Unknown network error'}` },
      { status: 500 }
    );
  }
}
