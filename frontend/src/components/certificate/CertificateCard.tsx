import React, { useState } from 'react';
import { DonationCertificate } from '@/types';
import { api } from '@/lib/api';

interface CertificateCardProps {
  certificate: DonationCertificate;
  isOwner?: boolean;
  onToggleVisibility?: (isPublic: boolean) => void;
}

export function CertificateCard({
  certificate,
  isOwner = false,
  onToggleVisibility,
}: CertificateCardProps) {
  const [isPublic, setIsPublic] = useState(certificate.isPublic);
  const [loading, setLoading] = useState(false);

  const handleToggleVisibility = async () => {
    setLoading(true);
    try {
      const response = await api.patch(`/api/v1/certificates/${certificate.id}`, {
        is_public: !isPublic,
      });
      setIsPublic(!isPublic);
      onToggleVisibility?.(!isPublic);
    } catch (error) {
      console.error('Failed to update visibility:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/api/v1/certificates/${certificate.id}/download`);
      const data = response.data || response;
      window.location.href = data.download_url;
    } catch (error) {
      console.error('Failed to download certificate:', error);
    }
  };

  const handlePrint = () => {
    window.open(certificate.s3Url, '_blank');
  };

  const handleShare = () => {
    const url = `${window.location.origin}/certificate/${certificate.id}`;
    navigator.clipboard.writeText(url);
    alert('Certificate link copied to clipboard!');
  };

  const handleShareFacebook = () => {
    const url = `${window.location.origin}/certificate/${certificate.id}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="certificate-card" style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r)',
      padding: 20,
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>
            💚 Certificate of Impact
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
            {formatDate(certificate.createdAt)}
          </p>
        </div>
        {isOwner && (
          <button
            onClick={handleToggleVisibility}
            disabled={loading}
            style={{
              background: isPublic ? 'var(--emerald)' : 'var(--gold)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 11,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {isPublic ? '🌐 Public' : '🔒 Private'}
          </button>
        )}
      </div>

      <div style={{
        background: 'rgba(16, 184, 145, 0.05)',
        border: '1px solid rgba(16, 184, 145, 0.2)',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
              Donor
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>
              {certificate.donorName}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
              Amount Donated
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--emerald)' }}>
              ₱{certificate.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
              Beneficiary
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>
              {certificate.beneficiaryName}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
              Milestone
            </div>
            <div style={{ fontSize: 13, color: 'var(--navy)' }}>
              {certificate.milestoneDescription}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        marginBottom: 16,
      }}>
        <div style={{
          background: 'rgba(37, 99, 235, 0.05)',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          borderRadius: 8,
          padding: 12,
        }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, fontWeight: 600 }}>
            Lives Touched
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#2563EB' }}>
            {certificate.livesTouched}
          </div>
        </div>
        <div style={{
          background: 'rgba(16, 184, 145, 0.05)',
          border: '1px solid rgba(16, 184, 145, 0.2)',
          borderRadius: 8,
          padding: 12,
        }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, fontWeight: 600 }}>
            Total Donated (All-time)
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--emerald)' }}>
            ₱{certificate.totalDonated.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <button
          onClick={handleDownload}
          style={{
            background: 'var(--emerald)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            flex: '1 1 auto',
            minWidth: 120,
          }}
        >
          📥 Download PDF
        </button>
        <button
          onClick={handlePrint}
          style={{
            background: 'var(--navy)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            flex: '1 1 auto',
            minWidth: 120,
          }}
        >
          🖨️ Print
        </button>
        <button
          onClick={handleShare}
          style={{
            background: 'var(--border)',
            color: 'var(--navy)',
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            flex: '1 1 auto',
            minWidth: 120,
          }}
        >
          🔗 Share Link
        </button>
        <button
          onClick={handleShareFacebook}
          style={{
            background: '#1877F2',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            flex: '1 1 auto',
            minWidth: 120,
          }}
        >
          📘 Facebook
        </button>
      </div>
    </div>
  );
}
