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
    // Simulated mock fallback for local testing and Vercel preview
    console.log(`[API Route] Running in Mock Mode for VGM Number: ${vgmNumber}`);
    
    // Simulate minor network delay (800ms) for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Create a deterministic hash from the VGM string to generate consistent fake data
    const hash = Array.from(vgmNumber).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const weight = 16000 + (hash % 14000); // 16,000 - 30,000 KG
    const containerSuffix = (1000000 + (hash * 7) % 9000000).toString();
    const certNum = (100000 + (hash * 13) % 900000).toString();

    return NextResponse.json({
      vgmNumber: vgmNumber.toUpperCase(),
      containerNumber: `MSCU${containerSuffix}`,
      bookingNumber: `BKG-${20000000 + (hash * 17) % 80000000}`,
      vgmWeight: weight,
      unit: 'KG',
      carrierName: 'MSC Mediterranean Shipping Co.',
      vesselName: 'MSC LORETO',
      voyageNumber: `60${hash % 10}W`,
      weighingDateTime: new Date(Date.now() - 3600000 * (hash % 24)).toISOString(),
      weighingMethod: 'Method 1 (Scale Weighing)',
      weighingStation: 'Jawaharlal Nehru Port Trust (JNPT) Scale #5',
      authorizedSignatory: 'Rajesh K. Mehta (Declarant Manager)',
      status: 'TRANSMITTED_OK',
      certificationId: `VGM-JNPT-${certNum}`,
      mode: 'MOCK_DATA'
    });
  }

  try {
    const authHeader = `Basic ${Buffer.from(`${sapUser}:${sapPass}`).toString('base64')}`;
    
    // We accommodate common SAP OData or REST URL formats:
    // 1. Entity endpoint: /ZVGM_DETAILS_SRV/VgmSet('VGM12345')
    // 2. Query filter endpoint: /ZVGM_DETAILS_SRV/VgmSet?$filter=VgmNumber eq 'VGM12345'
    let requestUrl = sapUrl;
    if (sapUrl.endsWith("')")) {
      // Already an entity call pattern
      requestUrl = sapUrl;
    } else if (sapUrl.includes('?$filter=')) {
      // Already has a filter query
      requestUrl = sapUrl;
    } else {
      // Append standard OData key style to the base entity set
      // Remove trailing slash if present
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
      next: { revalidate: 30 } // Cache results for 30s
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
    
    // OData responses usually wrap payload inside a 'd' wrapper
    const record = data.d ? data.d : data;

    // Map common SAP fields to the standard UI-friendly layout
    return NextResponse.json({
      vgmNumber: record.VgmNumber || record.vgmNumber || vgmNumber.toUpperCase(),
      containerNumber: record.ContainerNo || record.containerNumber || record.Container || 'N/A',
      bookingNumber: record.BookingNo || record.bookingNumber || record.Booking || 'N/A',
      vgmWeight: parseFloat(record.VgmWeight || record.weight || record.Weight || '0'),
      unit: record.Unit || record.uom || 'KG',
      carrierName: record.CarrierName || record.carrier || 'N/A',
      vesselName: record.VesselName || record.vessel || 'N/A',
      voyageNumber: record.VoyageNo || record.voyage || 'N/A',
      weighingDateTime: record.WeighDateTime || record.weighDate || new Date().toISOString(),
      weighingMethod: record.WeighMethod || record.method || 'Method 1',
      weighingStation: record.WeighStation || record.station || 'N/A',
      authorizedSignatory: record.AuthSignatory || record.signatory || 'N/A',
      status: record.Status || 'APPROVED',
      certificationId: record.CertId || record.certNumber || `VGM-SAP-${vgmNumber.toUpperCase()}`,
      mode: 'LIVE_SAP'
    });

  } catch (error: any) {
    console.error('[API Route] SAP API Connectivity Error:', error);
    return NextResponse.json(
      { error: `Connection failed: ${error.message || 'Unknown network error'}` },
      { status: 500 }
    );
  }
}
