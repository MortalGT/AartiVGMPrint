'use client';

import React, { useState, FormEvent } from 'react';

interface VgmDetails {
  deliveryNo: string;
  material: string;
  exportInvoiceNo: string;
  bookingNo: string;
  shipperName: string;
  shipperLicenseNo: string;
  authorizedOfficial: string;
  contactDetails: string;
  containerNo: string;
  containerSize: string;
  maxPermissibleWeight: number;
  weighbridgeAddress: string;
  weighingMethod: string;
  grossWeight: number;
  tareWeight: number;
  vgmWeight: number;
  weighingDateTime: string;
  weighingSlipNo: string;
  containerType: string;
  hazardousDetails: string;
  mode: 'MOCK_DATA' | 'LIVE_SAP';
  vgmNumber: string;
}

export default function VGMApp() {
  const [vgmInput, setVgmInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [vgmData, setVgmData] = useState<VgmDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'shipper' | 'container' | 'metrics'>('all');

  const fetchVgmDetails = async (e: FormEvent) => {
    e.preventDefault();
    if (!vgmInput.trim()) return;

    setLoading(true);
    setError(null);
    setVgmData(null);

    try {
      const response = await fetch(`/api/vgm?vgmNumber=${encodeURIComponent(vgmInput.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error fetching data (Status ${response.status})`);
      }

      setVgmData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while communicating with the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLoad = (exampleNum: string) => {
    setVgmInput(exampleNum);
    setLoading(true);
    setError(null);
    setVgmData(null);
    fetch(`/api/vgm?vgmNumber=${encodeURIComponent(exampleNum)}`)
      .then((res) => {
        if (!res.ok) throw new Error('API fetch failed');
        return res.json();
      })
      .then((data) => setVgmData(data))
      .catch((err) => setError('Quick load failed. Please try search.'))
      .finally(() => setLoading(false));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setVgmInput('');
    setVgmData(null);
    setError(null);
  };

  return (
    <>
      <div className="app-container">
        {/* BACKGROUND GLOWS */}
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>

        {/* HEADER SECTION (Screen Only) */}
        <header className="screen-header">
          <div className="logo-section">
            {/* Stylized Aarti Logo Icon */}
            <svg className="logo-icon-svg" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: '32px' }}>
              <path d="M10 35 L30 5 L40 18 L32 23 L25 10 L15 35 Z" fill="#0284c7" />
              <path d="M35 35 L45 20 L55 35 Z" fill="#f97316" />
            </svg>
            <span className="logo-text">Aarti VGM Print Console</span>
          </div>
          <div className="connection-badge">
            <span className="status-indicator active"></span>
            SAP Web Gateway Connected
          </div>
        </header>

        <main className="main-content">
          {/* LOOKUP FORM (Screen Only) */}
          <section className="search-section">
            <h1 className="search-title">Aarti Pharmalabs VGM Portal</h1>
            <p className="search-subtitle">
              Input a VGM Slip / Delivery / Container ID to retrieve logistics data directly from the SAP REST API and generate official shipping documents.
            </p>

            <form onSubmit={fetchVgmDetails} className="search-form">
              <div className="input-group">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Enter VGM Number (e.g. VGM77821, VGM99302)"
                  value={vgmInput}
                  onChange={(e) => setVgmInput(e.target.value)}
                  className="vgm-input"
                  disabled={loading}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading || !vgmInput.trim()}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Querying SAP Gateway...
                    </>
                  ) : (
                    'Retrieve VGM Details'
                  )}
                </button>
                {vgmData && (
                  <button type="button" onClick={handleReset} className="btn btn-secondary">
                    Clear
                  </button>
                )}
              </div>
            </form>

            <div className="quick-test-panel">
              <span className="quick-test-label">Sandbox Test IDs:</span>
              <button onClick={() => handleQuickLoad('VGM77821')} className="quick-btn">VGM77821</button>
              <button onClick={() => handleQuickLoad('VGM99302')} className="quick-btn">VGM99302</button>
              <button onClick={() => handleQuickLoad('VGM10045')} className="quick-btn">VGM10045</button>
            </div>
          </section>

          {/* ERROR STATE */}
          {error && (
            <div className="error-box">
              <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="error-message">
                <strong>SAP OData Service Error</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* SKELETON LOADER */}
          {loading && (
            <div className="skeleton-card">
              <div className="skeleton-header">
                <div className="skeleton-bar skeleton-title-bar"></div>
                <div className="skeleton-bar skeleton-badge-bar"></div>
              </div>
              <div className="skeleton-data-row"></div>
              <div className="skeleton-data-row"></div>
              <div className="skeleton-data-row"></div>
            </div>
          )}

          {/* DETAILS DISPLAY CARD (Screen Only) */}
          {vgmData && !loading && (
            <section className="details-card fade-in">
              <div className="details-card-header">
                <div>
                  <span className="badge badge-vgm-number">VGM: {vgmData.vgmNumber}</span>
                  <span className={`badge ${vgmData.mode === 'LIVE_SAP' ? 'badge-mode-live' : 'badge-mode-mock'}`}>
                    {vgmData.mode === 'LIVE_SAP' ? 'Live SAP Gateway' : 'Sandbox (Simulated SAP)'}
                  </span>
                </div>
                <div className="certification-badge-wrapper">
                  <span className="status-label">Transmission Status</span>
                  <span className="badge badge-status-ok">VERIFIED & SENT</span>
                </div>
              </div>

              {/* Segmented Tab controls for dashboard readability */}
              <div className="dashboard-tabs">
                <button onClick={() => setActiveTab('all')} className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}>All Fields</button>
                <button onClick={() => setActiveTab('shipper')} className={`tab-btn ${activeTab === 'shipper' ? 'active' : ''}`}>Shipper & Billing</button>
                <button onClick={() => setActiveTab('container')} className={`tab-btn ${activeTab === 'container' ? 'active' : ''}`}>Container Info</button>
                <button onClick={() => setActiveTab('metrics')} className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}>Weights & Weighbridge</button>
              </div>

              <div className="details-dashboard-content">
                <div className="dashboard-grid">
                  
                  {/* Section A: Commercial & Shipper Info */}
                  {(activeTab === 'all' || activeTab === 'shipper') && (
                    <div className="dashboard-panel">
                      <h3 className="panel-title-text">Shipper & Commercial Data</h3>
                      <div className="dashboard-list">
                        <div className="list-item">
                          <span className="list-lbl">Delivery No.</span>
                          <span className="list-val font-mono">{vgmData.deliveryNo}</span>
                        </div>
                        <div className="list-item">
                          <span className="list-lbl">Material Description</span>
                          <span className="list-val">{vgmData.material}</span>
                        </div>
                        <div className="list-item">
                          <span className="list-lbl">Export Invoice No.</span>
                          <span className="list-val font-mono">{vgmData.exportInvoiceNo}</span>
                        </div>
                        <div className="list-item">
                          <span className="list-lbl">Booking No.</span>
                          <span className="list-val font-mono">{vgmData.bookingNo}</span>
                        </div>
                        <div className="list-item">
                          <span className="list-lbl">Shipper Name</span>
                          <span className="list-val">{vgmData.shipperName}</span>
                        </div>
                        <div className="list-item">
                          <span className="list-lbl">Shipper Reg / License (IEC)</span>
                          <span className="list-val font-mono">{vgmData.shipperLicenseNo}</span>
                        </div>
                        <div className="list-item">
                          <span className="list-lbl">Authorized Signatory</span>
                          <span className="list-val highlight-declarant">{vgmData.authorizedOfficial}</span>
                        </div>
                        <div className="list-item">
                          <span className="list-lbl">Shipper Contact No.</span>
                          <span className="list-val">{vgmData.contactDetails}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section B: Container Info */}
                  {(activeTab === 'all' || activeTab === 'container') && (
                    <div className="dashboard-panel">
                      <h3 className="panel-title-text">Container Specs & Classification</h3>
                      <div className="dashboard-list">
                        <div className="list-item">
                          <span className="list-lbl">Container Number</span>
                          <span className="list-val font-mono font-bold-cyan">{vgmData.containerNo}</span>
                        </div>
                        <div className="list-item">
                          <span className="list-lbl">Container Size & Type</span>
                          <span className="list-val">{vgmData.containerSize}</span>
                        </div>
                        <div className="list-item">
                          <span className="list-lbl">Max Permissible Weight (CSC)</span>
                          <span className="list-val">{vgmData.maxPermissibleWeight.toLocaleString()} KG</span>
                        </div>
                        <div className="list-item">
                          <span className="list-lbl">Cargo Type</span>
                          <span className="list-val">{vgmData.containerType}</span>
                        </div>
                        <div className="list-item">
                          <span className="list-lbl">UN No / Class / PG / IMDG</span>
                          <span className="list-val font-mono">{vgmData.hazardousDetails}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section C: Weights & Weighbridge */}
                  {(activeTab === 'all' || activeTab === 'metrics') && (
                    <div className="dashboard-panel">
                      <h3 className="panel-title-text">Weight Verification Metrics</h3>
                      <div className="dashboard-list">
                        <div className="weight-stat-box">
                          <span className="weight-stat-lbl">VERIFIED GROSS MASS (VGM)</span>
                          <div className="weight-stat-num-box">
                            <span className="weight-stat-num">{vgmData.vgmWeight.toLocaleString()}</span>
                            <span className="weight-stat-unit">KG</span>
                          </div>
                        </div>
                        <div className="list-item">
                          <span className="list-lbl">Weighbridge address & Reg</span>
                          <span className="list-val">{vgmData.weighbridgeAddress}</span>
                        </div>
                        <div className="list-item">
                          <span className="list-lbl">Weighing Method</span>
                          <span className="list-val">{vgmData.weighingMethod}</span>
                        </div>
                        <div className="list-item">
                          <span className="list-lbl">Gross Weight + Pallet Weight</span>
                          <span className="list-val">{vgmData.grossWeight.toLocaleString()} KG</span>
                        </div>
                        <div className="list-item">
                          <span className="list-lbl">Tare Weight of Container</span>
                          <span className="list-val">{vgmData.tareWeight.toLocaleString()} KG</span>
                        </div>
                        <div className="list-item">
                          <span className="list-lbl">Date & Time of Weighing</span>
                          <span className="list-val font-mono">{vgmData.weighingDateTime}</span>
                        </div>
                        <div className="list-item">
                          <span className="list-lbl">Weighing Slip Number</span>
                          <span className="list-val font-mono">{vgmData.weighingSlipNo}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              <div className="card-actions">
                <button onClick={handlePrint} className="btn btn-print">
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  Print Official Slip
                </button>
              </div>
            </section>
          )}
        </main>

        {/* FOOTER (Screen Only) */}
        <footer className="screen-footer">
          <p>Aarti Pharmalabs Ltd &bull; Internal Shipping Document Portal &bull; Standard Vercel Serverless Integration</p>
        </footer>
      </div>

      {/* ========================================================
         DEDICATED PRINT-ONLY LAYOUT (Placed as a sibling to app-container)
         ======================================================== */}
      {vgmData && (
        <div className="aarti-print-document">
          
          {/* Header Section */}
          <div className="print-header-layout">
            <div className="header-logo-container">
              {/* Exact Stylized Logo from Aarti Pharmalabs */}
              <svg className="aarti-logo-print" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 32 L35 4 L48 18 L38 23 L30 11 L18 32 Z" fill="#0f4c81" />
                <path d="M42 32 L54 16 L66 32 Z" fill="#f05a28" />
              </svg>
              <div className="header-titles">
                <h1 className="aarti-title-main">AARTI PHARMALABS LTD</h1>
                <p className="aarti-address">
                  Plot No. D18, Tarapur MIDC, Boisar, District - Palghar, Maharashtra - 401506, India
                </p>
                <p className="aarti-website">WEBSITE WWW.AARTIPHARMALABS.COM</p>
              </div>
            </div>
          </div>

          {/* Document Section Banner */}
          <div className="document-banner-box">
            INFORMATION ABOUT VERIFIED GROSS MASS OF CONTAINER
          </div>

          {/* Table Container */}
          <table className="aarti-table">
            <thead>
              <tr>
                <th className="th-sr">Sr. No.</th>
                <th className="th-desc">Details of Information</th>
                <th className="th-part">Particulars</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-center font-bold">1</td>
                <td>Delivery No.</td>
                <td className="font-bold">{vgmData.deliveryNo}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">2</td>
                <td>Material</td>
                <td>{vgmData.material}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">3</td>
                <td>Export Invoice No.</td>
                <td>{vgmData.exportInvoiceNo}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">4</td>
                <td>Booking No.</td>
                <td className="font-bold">{vgmData.bookingNo}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">5</td>
                <td>Name of the Shipper code</td>
                <td>{vgmData.shipperName}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">6</td>
                <td>Shipper Registration / License No (IEC No / CIN No)</td>
                <td>{vgmData.shipperLicenseNo}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">7</td>
                <td>Name & Designation of the Official of the Shipper authorized to Sign document</td>
                <td className="font-bold">{vgmData.authorizedOfficial}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">8</td>
                <td>24 x 7 Contact details of Authorized official of Shipper</td>
                <td>{vgmData.contactDetails}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">9</td>
                <td>Container No</td>
                <td className="font-bold font-mono">{vgmData.containerNo}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">10</td>
                <td>Container Size (TEU/FUE/Others)</td>
                <td>{vgmData.containerSize}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">11</td>
                <td>Maximum permissible weight of container as per the CSC Plate</td>
                <td>{vgmData.maxPermissibleWeight}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">12</td>
                <td>Weighbridge registration no & address of weighbridge</td>
                <td>{vgmData.weighbridgeAddress}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">13</td>
                <td>Weighing Method (Method-1 /Method-2)</td>
                <td className="font-bold">{vgmData.weighingMethod}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">14</td>
                <td>Gross weight + pallet Weight</td>
                <td>{vgmData.grossWeight}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">15</td>
                <td>Tare weight of container</td>
                <td>{vgmData.tareWeight}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">16</td>
                <td>Verified Gross Mass of the Container (with unit of measure KG / MT / LBS)</td>
                <td className="font-bold highlight-print-val">{vgmData.vgmWeight}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">17</td>
                <td>Date & Time of Weighing</td>
                <td className="font-mono">{vgmData.weighingDateTime}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">18</td>
                <td>Weighing Slip No.</td>
                <td className="font-mono">{vgmData.weighingSlipNo}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">19</td>
                <td>Type (Normal / Reefer / Hazardous / Others)</td>
                <td>{vgmData.containerType}</td>
              </tr>
              <tr>
                <td className="text-center font-bold">20</td>
                <td>If Hazardous, UN No / Class / PG / IMDG</td>
                <td className="font-mono">{vgmData.hazardousDetails}</td>
              </tr>
            </tbody>
          </table>

        </div>
      )}
    </>
  );
}
