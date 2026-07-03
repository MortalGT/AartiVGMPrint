import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vgmNumber = searchParams.get('vgmNumber');

  if (!vgmNumber) {
    return NextResponse.json({ error: 'VGM Number is required' }, { status: 400 });
  }

  const sapUrl = process.env.SAP_API_URL;
  const sapUser = process.env.SAP_USERNAME;
  const sapPass = process.env.SAP_PASSWORD;

  // Verify if credentials are configured (and not matching the default templates)
  const isConfigured =
    sapUrl &&
    sapUrl !== 'https://your-sap-gateway-host:port/sap/opu/odata/sap/ZVGM_DETAILS_SRV/VgmSet' &&
    sapUser &&
    sapUser !== 'your_sap_username' &&
    sapPass &&
    sapPass !== 'your_sap_password';

  if (!isConfigured) {
    console.log(`[API Route] Running in Aarti Pharmalabs Mock Mode for VGM Number: ${vgmNumber}`);
    
    // Simulate minor network delay (800ms) for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Create a deterministic hash from the VGM string to generate consistent mock data
    const hash = Array.from(vgmNumber).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const slipNo = (1100 + (hash % 100)).toString();
    const deliveryNo = `00800${100000 + (hash * 7) % 900000}`;
    const bookingNo = `98951${(1000 + (hash * 3) % 9000)}`;
    const invoiceNo = `PEX/100${100 + (hash % 900)}/26-27`;
    
    const grossWeight = 20000 + (hash % 1000) * 10; // 20000 to 30000
    const tareWeight = 2300;
    const vgmWeight = grossWeight + tareWeight; // Gross + Tare

    return NextResponse.json({
      deliveryNo: deliveryNo,
      material: hash % 2 === 0 ? 'DES -Export Drum MS' : 'Chemical Compounds - UN Bulk',
      exportInvoiceNo: invoiceNo,
      bookingNo: bookingNo,
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
      weighingDateTime: '20260617114000', // Matches format from template image
      weighingSlipNo: slipNo,
      containerType: 'Hazardous',
      hazardousDetails: '1594/6.1/II',
      mode: 'MOCK_DATA',
      vgmNumber: vgmNumber.toUpperCase()
    });
  }

  try {
    const authHeader = `Basic ${Buffer.from(`${sapUser}:${sapPass}`).toString('base64')}`;
    
    let requestUrl = sapUrl;
    if (sapUrl.endsWith("')")) {
      requestUrl = sapUrl;
    } else if (sapUrl.includes('?$filter=')) {
      requestUrl = sapUrl;
    } else {
      const cleanBase = sapUrl.endsWith('/') ? sapUrl.slice(0, -1) : sapUrl;
      requestUrl = `${cleanBase}('${encodeURIComponent(vgmNumber.toUpperCase())}')`;
    }

    console.log(`[API Route] Connecting to SAP Gateway at: ${requestUrl}`);

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      next: { revalidate: 30 }
    });

    if (!response.ok) {
      const errorResponse = await response.text();
      console.error(`[API Route] SAP error status ${response.status}: ${errorResponse}`);
      return NextResponse.json(
        { error: `SAP Gateway Error: ${response.status} ${response.statusText}. Check server logs.` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const record = data.d ? data.d : data;

    // Map your SAP RFC/OData properties to the 20 Aarti Pharmalabs UI template fields
    return NextResponse.json({
      deliveryNo: record.DeliveryNo || record.DeliveryNumber || 'N/A',
      material: record.Material || record.MaterialDesc || 'N/A',
      exportInvoiceNo: record.ExportInvoiceNo || record.InvoiceNo || 'N/A',
      bookingNo: record.BookingNo || record.BookingNumber || 'N/A',
      shipperName: record.ShipperName || 'AARTI PHARMALABS LTD',
      shipperLicenseNo: record.ShipperLicenseNo || record.IecNo || 'AASCA9722G',
      authorizedOfficial: record.AuthOfficial || record.Signatory || 'Kinjal Vikam Export Logistic Head',
      contactDetails: record.ContactDetails || record.Phone || '9324005790',
      containerNo: record.ContainerNo || record.Container || 'N/A',
      containerSize: record.ContainerSize || record.Size || '20 BOX',
      maxPermissibleWeight: parseFloat(record.MaxPermissibleWeight || record.MaxWeight || '30480'),
      weighbridgeAddress: record.WeighbridgeAddress || record.Weighbridge || '474281 AARTI PHARMALAB LIMITED - UNIT VI',
      weighingMethod: record.WeighingMethod || record.Method || 'METHOD-1',
      grossWeight: parseFloat(record.GrossWeight || '0'),
      tareWeight: parseFloat(record.TareWeight || '0'),
      vgmWeight: parseFloat(record.VgmWeight || record.Weight || '0'),
      weighingDateTime: record.WeighingDateTime || record.WeighDateTime || 'N/A',
      weighingSlipNo: record.WeighingSlipNo || record.SlipNo || 'N/A',
      containerType: record.ContainerType || record.Type || 'Hazardous',
      hazardousDetails: record.HazardousDetails || record.UnNo || 'N/A',
      mode: 'LIVE_SAP',
      vgmNumber: record.VgmNumber || vgmNumber.toUpperCase()
    });

  } catch (error: any) {
    console.error('[API Route] SAP API Connectivity Error:', error);
    return NextResponse.json(
      { error: `Connection failed: ${error.message || 'Unknown network error'}` },
      { status: 500 }
    );
  }
}
