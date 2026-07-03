'use client';

import React, { useState, FormEvent } from 'react';

interface VgmDetails {
  vgmNumber: string;
  containerNumber: string;
  bookingNumber: string;
  vgmWeight: number;
  unit: string;
  carrierName: string;
  vesselName: string;
  voyageNumber: string;
  weighingDateTime: string;
  weighingMethod: string;
  weighingStation: string;
  authorizedSignatory: string;
  status: string;
  certificationId: string;
  mode: 'MOCK_DATA' | 'LIVE_SAP';
}

export default function VGMApp() {
  const [vgmInput, setVgmInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [vgmData, setVgmData] = useState<VgmDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    // Directly fetch using the number
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

  // Helper to format dates nicely
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="app-container">
      {/* BACKGROUND GLOWS */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>

      {/* HEADER SECTION (Screen Only) */}
      <header className="screen-header">
        <div className="logo-section">
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span className="logo-text">Aarti VGM Portal</span>
        </div>
        <div className="connection-badge">
          <span className="status-indicator active"></span>
          SAP Gateway Ready
        </div>
      </header>

      <main className="main-content">
        {/* LOOKUP FORM (Screen Only) */}
        <section className="search-section">
          <h1 className="search-title">Retrieve Verified Gross Mass</h1>
          <p className="search-subtitle">
            Enter a VGM ID to fetch verified shipping details from the SAP Gateway and generate a printable SOLAS-compliant slip.
          </p>

          <form onSubmit={fetchVgmDetails} className="search-form">
            <div className="input-group">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="e.g. VGM100234, VGM88492"
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
                    Fetching SAP...
                  </>
                ) : (
                  'Retrieve Document'
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
            <span className="quick-test-label">Quick Test IDs:</span>
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
              <strong>SAP Retrieval Failed</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* SKELETON LOADER STATE */}
        {loading && (
          <div className="skeleton-card">
            <div className="skeleton-header">
              <div className="skeleton-bar skeleton-title-bar"></div>
              <div className="skeleton-bar skeleton-badge-bar"></div>
            </div>
            <div className="skeleton-grid">
              <div className="skeleton-column">
                <div className="skeleton-bar skeleton-data-row"></div>
                <div className="skeleton-bar skeleton-data-row"></div>
                <div className="skeleton-bar skeleton-data-row"></div>
                <div className="skeleton-bar skeleton-data-row"></div>
              </div>
              <div className="skeleton-column">
                <div className="skeleton-bar skeleton-data-row"></div>
                <div className="skeleton-bar skeleton-data-row"></div>
                <div className="skeleton-bar skeleton-data-row"></div>
                <div className="skeleton-bar skeleton-data-row"></div>
              </div>
            </div>
          </div>
        )}

        {/* DETAILS DISPLAY CARD (Screen Only) */}
        {vgmData && !loading && (
          <section className="details-card fade-in">
            <div className="details-card-header">
              <div>
                <span className="badge badge-vgm-number">{vgmData.vgmNumber}</span>
                <span className={`badge ${vgmData.mode === 'LIVE_SAP' ? 'badge-mode-live' : 'badge-mode-mock'}`}>
                  {vgmData.mode === 'LIVE_SAP' ? 'Live SAP Gateway' : 'Demonstration / Sandbox Mode'}
                </span>
              </div>
              <div className="certification-badge-wrapper">
                <span className="status-label">Transmit Status</span>
                <span className="badge badge-status-ok">SUCCESS</span>
              </div>
            </div>

            <div className="details-grid">
              {/* PRIMARY PARAMETERS */}
              <div className="details-panel primary-panel">
                <div className="weight-display-container">
                  <span className="weight-label">Verified Gross Mass (VGM)</span>
                  <div className="weight-value-box">
                    <span className="weight-number">
                      {vgmData.vgmWeight.toLocaleString()}
                    </span>
                    <span className="weight-unit">{vgmData.unit}</span>
                  </div>
                </div>

                <div className="data-list">
                  <div className="data-item">
                    <span className="data-label">Container Number</span>
                    <span className="data-value highlight">{vgmData.containerNumber}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Booking Number</span>
                    <span className="data-value highlight">{vgmData.bookingNumber}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Certificate ID</span>
                    <span className="data-value font-mono">{vgmData.certificationId}</span>
                  </div>
                </div>
              </div>

              {/* SHIPMENT METADATA */}
              <div className="details-panel secondary-panel">
                <h3 className="panel-title">Shipping & Weighing Metadata</h3>
                <div className="data-list">
                  <div className="data-item">
                    <span className="data-label">Vessel Name</span>
                    <span className="data-value">{vgmData.vesselName} (Voyage: {vgmData.voyageNumber})</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Carrier</span>
                    <span className="data-value">{vgmData.carrierName}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Weigh Date & Time</span>
                    <span className="data-value">{formatDate(vgmData.weighingDateTime)}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Weighing Method</span>
                    <span className="data-value">{vgmData.weighingMethod}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Weighing Station</span>
                    <span className="data-value">{vgmData.weighingStation}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Authorized Declarant</span>
                    <span className="data-value signatory-value">{vgmData.authorizedSignatory}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-actions">
              <button onClick={handlePrint} className="btn btn-print">
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print Document
              </button>
            </div>
          </section>
        )}
      </main>

      {/* FOOTER (Screen Only) */}
      <footer className="screen-footer">
        <p>Aarti VGM Print Console &bull; Optimized for Vercel Serverless &bull; Version 1.0.0</p>
      </footer>

      {/* DEDICATED PRINT-ONLY LAYOUT (Always hidden on screen, formatted via CSS for print) */}
      {vgmData && (
        <div className="print-only-container">
          <div className="print-header">
            <div className="print-title-section">
              <h1>VERIFIED GROSS MASS (VGM) CERTIFICATE</h1>
              <p className="solas-disclaimer">SOLAS Chapter VI, Regulation 2 Compliant Document</p>
            </div>
            <div className="print-doc-meta">
              <div className="meta-box">
                <span className="meta-box-label">Certificate ID:</span>
                <span className="meta-box-value font-mono">{vgmData.certificationId}</span>
              </div>
              <div className="meta-box">
                <span className="meta-box-label">Date Generated:</span>
                <span className="meta-box-value">{formatDate(new Date().toISOString())}</span>
              </div>
            </div>
          </div>

          <table className="print-table">
            <thead>
              <tr>
                <th colSpan={4} className="table-section-header">1. SHIPMENT IDENTIFICATION</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="cell-label w-25">VGM Record Number:</td>
                <td className="cell-value w-25 font-bold">{vgmData.vgmNumber}</td>
                <td className="cell-label w-25">Booking Number:</td>
                <td className="cell-value w-25 font-bold">{vgmData.bookingNumber}</td>
              </tr>
              <tr>
                <td className="cell-label">Container Number:</td>
                <td className="cell-value font-bold font-mono">{vgmData.containerNumber}</td>
                <td className="cell-label">Carrier Name:</td>
                <td className="cell-value">{vgmData.carrierName}</td>
              </tr>
              <tr>
                <td className="cell-label">Vessel Name:</td>
                <td className="cell-value">{vgmData.vesselName}</td>
                <td className="cell-label">Voyage Number:</td>
                <td className="cell-value">{vgmData.voyageNumber}</td>
              </tr>
            </tbody>
          </table>

          <table className="print-table">
            <thead>
              <tr>
                <th colSpan={4} className="table-section-header">2. VERIFIED GROSS MASS METRICS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="cell-label w-25">Verified Weight:</td>
                <td className="cell-value w-25 font-bold highlight-print-weight">
                  {vgmData.vgmWeight.toLocaleString()} {vgmData.unit}
                </td>
                <td className="cell-label w-25">Weighing Method:</td>
                <td className="cell-value w-25">{vgmData.weighingMethod}</td>
              </tr>
              <tr>
                <td className="cell-label">Weighing Timestamp:</td>
                <td className="cell-value">{formatDate(vgmData.weighingDateTime)}</td>
                <td className="cell-label">Weighing Station:</td>
                <td className="cell-value">{vgmData.weighingStation}</td>
              </tr>
            </tbody>
          </table>

          <div className="print-declaration">
            <h3>3. DECLARATION & AUTHORIZATION</h3>
            <p>
              We hereby declare that the Verified Gross Mass (VGM) details submitted in this document are correct and have
              been obtained in accordance with the requirements of the International Convention for the Safety of Life at
              Sea (SOLAS) Chapter VI Regulation 2, and the guidelines set forth by local maritime regulatory agencies.
            </p>
          </div>

          <div className="print-signatures">
            <div className="signature-column">
              <span className="signature-title">Authorized Signatory / Declarant:</span>
              <div className="signature-line">
                <span className="signature-font">{vgmData.authorizedSignatory}</span>
              </div>
              <span className="signature-subtext">Signature on file (SAP Authorized Login)</span>
            </div>

            <div className="signature-column">
              <span className="signature-title">Transmission Verification Stamp:</span>
              <div className="stamp-box">
                <div className="stamp-text-status">TRANSMITTED</div>
                <div className="stamp-text-time">{formatDate(vgmData.weighingDateTime)}</div>
                <div className="stamp-text-source">SAP HOST INTEGRATION</div>
              </div>
            </div>
          </div>

          <div className="print-footer">
            <div className="barcode-placeholder">
              {/* Inline SVG rendering a simple mock barcode */}
              <svg width="220" height="40" viewBox="0 0 100 20">
                <rect x="0" y="0" width="1" height="20" fill="black" />
                <rect x="2" y="0" width="2" height="20" fill="black" />
                <rect x="5" y="0" width="1" height="20" fill="black" />
                <rect x="7" y="0" width="1" height="20" fill="black" />
                <rect x="9" y="0" width="3" height="20" fill="black" />
                <rect x="13" y="0" width="1" height="20" fill="black" />
                <rect x="16" y="0" width="2" height="20" fill="black" />
                <rect x="19" y="0" width="1" height="20" fill="black" />
                <rect x="21" y="0" width="4" height="20" fill="black" />
                <rect x="26" y="0" width="1" height="20" fill="black" />
                <rect x="28" y="0" width="2" height="20" fill="black" />
                <rect x="31" y="0" width="1" height="20" fill="black" />
                <rect x="33" y="0" width="3" height="20" fill="black" />
                <rect x="37" y="0" width="1" height="20" fill="black" />
                <rect x="39" y="0" width="2" height="20" fill="black" />
                <rect x="42" y="0" width="1" height="20" fill="black" />
                <rect x="44" y="0" width="4" height="20" fill="black" />
                <rect x="49" y="0" width="1" height="20" fill="black" />
                <rect x="51" y="0" width="2" height="20" fill="black" />
                <rect x="54" y="0" width="1" height="20" fill="black" />
                <rect x="56" y="0" width="3" height="20" fill="black" />
                <rect x="60" y="0" width="1" height="20" fill="black" />
                <rect x="62" y="0" width="2" height="20" fill="black" />
                <rect x="65" y="0" width="1" height="20" fill="black" />
                <rect x="67" y="0" width="4" height="20" fill="black" />
                <rect x="72" y="0" width="1" height="20" fill="black" />
                <rect x="74" y="0" width="2" height="20" fill="black" />
                <rect x="77" y="0" width="1" height="20" fill="black" />
                <rect x="79" y="0" width="3" height="20" fill="black" />
                <rect x="83" y="0" width="1" height="20" fill="black" />
                <rect x="85" y="0" width="2" height="20" fill="black" />
                <rect x="88" y="0" width="1" height="20" fill="black" />
                <rect x="90" y="0" width="4" height="20" fill="black" />
                <rect x="95" y="0" width="1" height="20" fill="black" />
                <rect x="97" y="0" width="2" height="20" fill="black" />
              </svg>
              <div className="barcode-number">*{vgmData.certificationId}*</div>
            </div>
            <p className="system-footer-line">
              This document is system generated from Aarti VGM database using digital authorization signatures. 
              No physical signature is required under SOLAS guidance circular MSC.1/Circ.1475.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
