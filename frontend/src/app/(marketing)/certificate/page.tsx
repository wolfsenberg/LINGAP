'use client';

import { useState, useEffect } from 'react';
import { DonationCertificate } from '@/types';

interface CertificateTemplate {
  donorName: string;
  amount: string;
  milestone: string;
  date: string;
  txId: string;
  merkleProof: string;
  onchainHash: string;
}

export default function CertificatePage() {
  const [assetView, setAssetView] = useState<'svg' | 'formatted'>('svg');
  const [certificate, setCertificate] = useState<CertificateTemplate>({
    donorName: 'Jose Dela Cruz',
    amount: '₱5,000.00',
    milestone: 'Chemotherapy Cycle 3 — Completed ✅',
    date: 'November 28, 2025',
    txId: 'STELLAR:0x4a8f3c2b9e1d...7f2a',
    merkleProof: 'QmX5a8Pz7nLjYk9mVp3qW2rS8tU1vX0yZ',
    onchainHash: '2b5f9c3a1e7d4k6m9n0p2q5r8s1t4u7v',
  });

  const generateShareUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/certificate/view`;
    }
    return '';
  };

  const handleFacebookShare = () => {
    const shareUrl = generateShareUrl();
    const encodedUrl = encodeURIComponent(shareUrl);
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    window.open(facebookShareUrl, 'facebook-share', 'width=600,height=400');
  };

  const handleLinkedInShare = () => {
    const shareUrl = generateShareUrl();
    const encodedUrl = encodeURIComponent(shareUrl);
    const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    window.open(linkedinShareUrl, 'linkedin-share', 'width=600,height=400');
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch('/api/v1/certificates/download', {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${certificate.donorName.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  return (
    <div>
      <div style={{ background: 'var(--navy)', padding: '48px 40px', textAlign: 'center' }}>
        <div className="container">
          <div className="section-label" style={{ color: 'var(--emerald)' }}>IMPACT CERTIFICATE</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>Your Verified Giving Record</h1>
          <p style={{ color: 'rgba(255,255,255,.65)', marginTop: 10 }}>Blockchain-verified proof that your donation created real impact.</p>
        </div>
      </div>

      <div style={{ padding: '40px 20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
            alignItems: 'start',
          }}>
            {/* LEFT PANE: EDUCATIONAL HUB */}
            <div style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '32px',
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', marginBottom: 20 }}>
                📚 Educational Context
              </h2>

              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8 }}>
                  What This Credential Represents
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>
                  This certificate verifies a direct contribution to verified healthcare interventions in the Philippines. Your donation was routed through smart contract escrow and released only upon milestone completion.
                </p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Active Impact Campaign Goals
                </h3>
                <ul style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8, paddingLeft: 20 }}>
                  <li>Provide Stage 3 cancer treatment access</li>
                  <li>Ensure institutional healthcare delivery</li>
                  <li>Enable patient-centered care outcomes</li>
                  <li>Track end-to-end fund utilization</li>
                </ul>
              </div>

              <div style={{
                background: 'rgba(16, 184, 145, 0.06)',
                border: '1px solid rgba(16, 184, 145, 0.2)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
              }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--emerald)', textTransform: 'uppercase', marginBottom: 12 }}>
                  ✅ Verification Details
                </h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text3)' }}>Blockchain Verified</span>
                    <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>✓ Confirmed</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text3)' }}>Smart Contract Status</span>
                    <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>✓ Executed</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text3)' }}>Fund Disbursement</span>
                    <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>✓ Completed</span>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(37, 99, 235, 0.06)',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                borderRadius: 12,
                padding: 16,
              }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#2563EB', textTransform: 'uppercase', marginBottom: 12 }}>
                  📊 Impact Metrics
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Lives Touched</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#2563EB' }}>1</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Total Lifetime Donated</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--emerald)' }}>₱5,000.00</div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT PANE: INTERACTIVE CANVAS */}
            <div style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '32px',
              position: 'relative',
            }}>
              {/* Asset Type Toggle */}
              <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text3)' }}>View Format:</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setAssetView('svg')}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: assetView === 'svg' ? 'var(--navy)' : '#fff',
                      color: assetView === 'svg' ? '#fff' : 'var(--navy)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    📄 SVG Dynamic
                  </button>
                  <button
                    onClick={() => setAssetView('formatted')}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: assetView === 'formatted' ? 'var(--emerald)' : '#fff',
                      color: assetView === 'formatted' ? '#fff' : 'var(--emerald)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    🎨 Formatted Render
                  </button>
                </div>
              </div>

              {/* Canvas Render Area */}
              <div style={{
                background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)',
                border: '2px solid var(--border)',
                borderRadius: 12,
                padding: 24,
                minHeight: 450,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                marginBottom: 24,
              }}>
                {assetView === 'svg' && (
                  <div>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📜</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
                      Certificate of Humanitarian Impact
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20 }}>
                      LINGAP — Ledger for Integrity, Need-based Giving, Aid Provenance & Protection
                    </p>
                    <div style={{
                      background: 'rgba(16, 184, 145, 0.1)',
                      border: '1px solid rgba(16, 184, 145, 0.2)',
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 16,
                    }}>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Donor</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>
                        {certificate.donorName}
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(37, 99, 235, 0.1)',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                      borderRadius: 8,
                      padding: 12,
                    }}>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Amount Contributed</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--emerald)' }}>
                        {certificate.amount}
                      </div>
                    </div>
                  </div>
                )}

                {assetView === 'formatted' && (
                  <div style={{ width: '100%' }}>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>
                        Milestone
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>
                        {certificate.milestone}
                      </div>
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>
                        Transaction Reference
                      </div>
                      <div style={{
                        fontSize: 12,
                        fontFamily: 'Space Mono, monospace',
                        color: 'var(--emerald)',
                        wordBreak: 'break-all',
                      }}>
                        {certificate.txId}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>
                        Date Recorded
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>
                        {certificate.date}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Share Engine */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 12 }}>
                  🌐 Share Your Impact
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}>
                  <button
                    onClick={handleFacebookShare}
                    style={{
                      background: '#1877F2',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    📘 Facebook
                  </button>
                  <button
                    onClick={handleLinkedInShare}
                    style={{
                      background: '#0A66C2',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    💼 LinkedIn
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    style={{
                      background: 'var(--emerald)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      gridColumn: '1 / -1',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    📥 Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Blockchain Verification Footer */}
          <div style={{
            marginTop: 40,
            background: 'var(--navy)',
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
              🔐 Blockchain Verification Details
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 20,
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Merkle Proof
                </div>
                <div style={{
                  fontSize: 12,
                  fontFamily: 'Space Mono, monospace',
                  color: 'var(--emerald)',
                  wordBreak: 'break-all',
                  lineHeight: 1.4,
                }}>
                  {certificate.merkleProof}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Consensus Hash
                </div>
                <div style={{
                  fontSize: 12,
                  fontFamily: 'Space Mono, monospace',
                  color: 'var(--emerald)',
                  wordBreak: 'break-all',
                  lineHeight: 1.4,
                }}>
                  {certificate.onchainHash}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
