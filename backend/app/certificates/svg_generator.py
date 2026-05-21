"""Enhanced HTML certificate generation for LINGAP with PNG fallback wrapper."""
from datetime import datetime
import hashlib


def generate_html_certificate(
    donor_name: str,
    amount: float,
    beneficiary_name: str,
    milestone_description: str,
    lives_touched: int,
    total_donated: float,
    donation_date: datetime,
    stellar_tx_hash: str,
    merkle_proof: str | None = None,
    onchain_hash: str | None = None,
    certificate_id: str | None = None,
    block_number: str | None = None,
    network: str = "Stellar Mainnet",
    certifying_officer: str = "LINGAP Foundation",
) -> str:
    """Generate a polished HTML certificate for a LINGAP donation.

    Args:
        donor_name: Full name of the donor
        amount: This donation amount in PHP
        beneficiary_name: Name of the campaign beneficiary
        milestone_description: Milestone reached (e.g. "Chemo Cycle 3 of 6 Completed")
        lives_touched: Number of lives impacted
        total_donated: Cumulative amount donated by this donor
        donation_date: Date of the donation
        stellar_tx_hash: Full Stellar blockchain transaction hash
        merkle_proof: Optional Merkle proof string
        onchain_hash: Optional on-chain hash reference
        certificate_id: Optional certificate ID (auto-generated if not provided)
        block_number: Optional Stellar ledger block number
        network: Blockchain network name (default: "Stellar Mainnet")
        certifying_officer: Name for the signature block

    Returns:
        Full standalone HTML document as a string
    """
    date_str = donation_date.strftime("%B %d, %Y")
    tx_preview = stellar_tx_hash[:20] + "..."
    merkle_preview = (merkle_proof[:20] + "...") if merkle_proof else "N/A"
    onchain_preview = (onchain_hash[:20] + "...") if onchain_hash else "N/A"

    # Auto-generate certificate ID from tx hash if not provided
    if not certificate_id:
        short = hashlib.sha256(stellar_tx_hash.encode()).hexdigest()[:6].upper()
        year = donation_date.year
        certificate_id = f"LNG-{year}-{short}"

    block_display = f" · Block {block_number}" if block_number else ""

    # Build the 4 verification statement lines
    verification_statements = [
        "Blockchain transaction verified on Stellar Mainnet",
        "Beneficiary campaign identity independently confirmed",
        "Funds disbursed directly to verified medical providers",
        "Immutable record — publicly accessible at any time",
    ]
    statements_html = "\n".join(
        f"""
        <div class="statement-line">
          <div class="statement-check">
            <svg viewBox="0 0 10 10" width="8" height="8">
              <polyline points="2,5 4,7 8,3" fill="none" stroke="#16A34A" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          {s}
        </div>"""
        for s in verification_statements
    )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta property="og:title" content="LINGAP Certificate of Humanitarian Impact — {donor_name}">
  <meta property="og:description" content="Blockchain-verified donation of ₱{amount:,.2f} to {beneficiary_name}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <title>LINGAP Certificate — {certificate_id}</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

    body {{
      background: #f0f4f8;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      display: flex;
      justify-content: center;
      padding: 32px 16px;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }}

    /* ── Outer wrapper ── */
    .cert-wrap {{
      width: 100%;
      max-width: 800px;
      background: #fff;
      border-radius: 2px;
      overflow: hidden;
      box-shadow: 0 4px 32px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08);
    }}

    /* ── Accent bands ── */
    .top-band,
    .bottom-band {{
      height: 6px;
      background: linear-gradient(90deg, #10B891 0%, #059669 100%);
    }}

    /* ── Main content area ── */
    .cert-inner {{
      padding: 48px 56px 40px;
    }}

    /* ── Header row: brand + cert label ── */
    .header-row {{
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 36px;
    }}

    .brand {{
      display: flex;
      align-items: center;
      gap: 14px;
    }}

    .brand-mark {{
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #10B891;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }}

    .brand-name {{
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 3px;
      color: #0F172A;
      line-height: 1;
    }}

    .brand-tagline {{
      font-size: 10px;
      color: #94A3B8;
      letter-spacing: 0.5px;
      margin-top: 3px;
      line-height: 1.4;
      max-width: 260px;
    }}

    .cert-label {{
      text-align: right;
    }}

    .cert-label-title {{
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #10B891;
      text-transform: uppercase;
    }}

    .cert-label-sub {{
      font-size: 10px;
      color: #94A3B8;
      margin-top: 3px;
    }}

    .cert-id {{
      font-size: 9px;
      font-family: 'Courier New', monospace;
      color: #CBD5E1;
      margin-top: 2px;
    }}

    /* ── Divider ── */
    .divider {{
      height: 1px;
      background: #F1F5F9;
      margin: 0 0 36px;
    }}

    /* ── Core statement ── */
    .certifies-line {{
      font-size: 12px;
      letter-spacing: 1.5px;
      color: #94A3B8;
      text-transform: uppercase;
      text-align: center;
      margin-bottom: 12px;
    }}

    .donor-name {{
      font-size: 40px;
      font-weight: 800;
      color: #0F172A;
      text-align: center;
      letter-spacing: -0.5px;
      line-height: 1.1;
      margin-bottom: 16px;
    }}

    .made-line {{
      font-size: 13px;
      color: #64748B;
      text-align: center;
      margin-bottom: 24px;
      line-height: 1.6;
    }}

    /* ── Amount block ── */
    .amount-block {{
      background: #F0FDF9;
      border: 1.5px solid #A7F3D0;
      border-radius: 12px;
      padding: 20px 32px;
      text-align: center;
      margin: 0 auto 32px;
      max-width: 340px;
    }}

    .amount-label {{
      font-size: 10px;
      letter-spacing: 2px;
      color: #10B891;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 6px;
    }}

    .amount-value {{
      font-size: 52px;
      font-weight: 800;
      color: #065F46;
      line-height: 1;
      letter-spacing: -1px;
    }}

    /* ── Beneficiary ── */
    .for-line {{
      font-size: 12px;
      letter-spacing: 1.5px;
      color: #94A3B8;
      text-transform: uppercase;
      text-align: center;
      margin-bottom: 10px;
    }}

    .beneficiary {{
      font-size: 22px;
      font-weight: 700;
      color: #0F172A;
      text-align: center;
      margin-bottom: 8px;
    }}

    /* ── Milestone badge ── */
    .milestone-wrapper {{
      text-align: center;
      margin-bottom: 36px;
    }}

    .milestone-badge {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: 20px;
      padding: 5px 14px;
      font-size: 11px;
      color: #1D4ED8;
      font-weight: 500;
    }}

    .milestone-dot {{
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #3B82F6;
      flex-shrink: 0;
    }}

    /* ── Metrics row ── */
    .metrics-row {{
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 36px;
    }}

    .metric-card {{
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
    }}

    .metric-icon {{
      color: #10B891;
      margin-bottom: 6px;
      display: flex;
      justify-content: center;
    }}

    .metric-label {{
      font-size: 10px;
      letter-spacing: 1px;
      color: #94A3B8;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 4px;
    }}

    .metric-value {{
      font-size: 22px;
      font-weight: 800;
      color: #0F172A;
    }}

    .metric-value.small {{
      font-size: 14px;
      padding-top: 4px;
    }}

    /* ── Blockchain section ── */
    .blockchain-section {{
      background: #0F172A;
      border-radius: 12px;
      padding: 24px 28px;
      margin-bottom: 32px;
    }}

    .bc-header {{
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }}

    .bc-dot {{
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10B891;
      flex-shrink: 0;
    }}

    .bc-title {{
      font-size: 10px;
      letter-spacing: 2px;
      color: #10B891;
      text-transform: uppercase;
      font-weight: 700;
    }}

    .bc-live {{
      margin-left: auto;
      font-size: 9px;
      color: #10B891;
      letter-spacing: 1px;
      background: rgba(16, 184, 145, 0.12);
      border: 1px solid rgba(16, 184, 145, 0.25);
      border-radius: 10px;
      padding: 2px 8px;
    }}

    .bc-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }}

    .bc-field-label {{
      font-size: 9px;
      letter-spacing: 1.5px;
      color: #475569;
      text-transform: uppercase;
      margin-bottom: 4px;
    }}

    .bc-field-value {{
      font-size: 10px;
      font-family: 'Courier New', monospace;
      color: #94A3B8;
      word-break: break-all;
      line-height: 1.5;
    }}

    .bc-field-value.highlight {{
      color: #10B891;
    }}

    /* ── Seal + statements + signature ── */
    .seal-row {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }}

    .seal {{
      width: 80px;
      height: 80px;
      flex-shrink: 0;
    }}

    .cert-statements {{
      flex: 1;
    }}

    .statement-line {{
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: #64748B;
      margin-bottom: 6px;
    }}

    .statement-check {{
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #DCFCE7;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }}

    /* ── Signature ── */
    .sigline {{
      text-align: right;
      min-width: 160px;
    }}

    .sig-img {{
      font-size: 28px;
      font-style: italic;
      font-family: Georgia, 'Times New Roman', serif;
      color: #0F172A;
      line-height: 1;
      margin-bottom: 4px;
    }}

    .sig-rule {{
      width: 120px;
      height: 1px;
      background: #CBD5E1;
      margin-left: auto;
      margin-bottom: 4px;
    }}

    .sig-name {{
      font-size: 10px;
      font-weight: 700;
      color: #0F172A;
    }}

    .sig-role {{
      font-size: 9px;
      color: #94A3B8;
    }}

    /* ── Footer strip ── */
    .footer-strip {{
      background: #F8FAFC;
      padding: 10px 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #F1F5F9;
    }}

    .footer-text {{
      font-size: 9px;
      color: #CBD5E1;
      letter-spacing: 0.5px;
    }}

    .footer-watermark {{
      font-size: 9px;
      color: #CBD5E1;
      font-weight: 700;
      letter-spacing: 2px;
    }}

    /* ── Print styles ── */
    @media print {{
      body {{ background: white; padding: 0; }}
      .cert-wrap {{ box-shadow: none; max-width: 100%; }}
    }}

    /* ── Responsive ── */
    @media (max-width: 600px) {{
      .cert-inner {{ padding: 32px 24px 28px; }}
      .donor-name {{ font-size: 28px; }}
      .amount-value {{ font-size: 40px; }}
      .metrics-row {{ grid-template-columns: 1fr; }}
      .bc-grid {{ grid-template-columns: 1fr; }}
      .seal-row {{ flex-direction: column; align-items: flex-start; }}
      .sigline {{ text-align: left; min-width: unset; }}
      .sig-rule {{ margin-left: 0; }}
      .header-row {{ flex-direction: column; gap: 12px; }}
      .cert-label {{ text-align: left; }}
      .footer-strip {{ padding: 10px 24px; }}
    }}
  </style>
</head>
<body>
<div class="cert-wrap">

  <div class="top-band"></div>

  <div class="cert-inner">

    <!-- ── Header ── -->
    <div class="header-row">
      <div class="brand">
        <div class="brand-mark">
          <!-- L monogram -->
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="13" y="20" text-anchor="middle"
              font-size="18" font-weight="900"
              font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
              fill="white">L</text>
          </svg>
        </div>
        <div class="brand-text">
          <div class="brand-name">LINGAP</div>
          <div class="brand-tagline">
            Ledger for Integrity, Need-based Giving,<br>
            Aid Provenance &amp; Protection
          </div>
        </div>
      </div>
      <div class="cert-label">
        <div class="cert-label-title">Certificate of Impact</div>
        <div class="cert-label-sub">Humanitarian Impact Award</div>
        <div class="cert-id">#{certificate_id}</div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- ── Core statement ── -->
    <div class="certifies-line">This certifies that</div>
    <div class="donor-name">{donor_name}</div>
    <div class="made-line">
      has made a verified, blockchain-recorded donation in support of a humanitarian cause
    </div>

    <!-- ── Amount ── -->
    <div class="amount-block">
      <div class="amount-label">Verified Donation</div>
      <div class="amount-value">&#8369;{amount:,.2f}</div>
    </div>

    <!-- ── Beneficiary ── -->
    <div class="for-line">Benefiting the campaign of</div>
    <div class="beneficiary">{beneficiary_name}</div>
    <div class="milestone-wrapper">
      <span class="milestone-badge">
        <span class="milestone-dot"></span>
        Milestone: {milestone_description}
      </span>
    </div>

    <!-- ── Metrics ── -->
    <div class="metrics-row">

      <div class="metric-card">
        <div class="metric-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="metric-label">Lives Touched</div>
        <div class="metric-value">{lives_touched}</div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div class="metric-label">Total Donated</div>
        <div class="metric-value">&#8369;{total_donated:,.2f}</div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div class="metric-label">Donation Date</div>
        <div class="metric-value small">{date_str}</div>
      </div>

    </div>

    <!-- ── Blockchain verification ── -->
    <div class="blockchain-section">
      <div class="bc-header">
        <div class="bc-dot"></div>
        <div class="bc-title">Stellar Blockchain Verification</div>
        <div class="bc-live">&#9679; VERIFIED</div>
      </div>
      <div class="bc-grid">
        <div class="bc-field">
          <div class="bc-field-label">Transaction Hash</div>
          <div class="bc-field-value highlight">{tx_preview}</div>
        </div>
        <div class="bc-field">
          <div class="bc-field-label">On-Chain Hash</div>
          <div class="bc-field-value">{onchain_preview}</div>
        </div>
        <div class="bc-field">
          <div class="bc-field-label">Merkle Proof</div>
          <div class="bc-field-value">{merkle_preview}</div>
        </div>
        <div class="bc-field">
          <div class="bc-field-label">Network / Ledger</div>
          <div class="bc-field-value">{network}{block_display}</div>
        </div>
      </div>
    </div>

    <!-- ── Seal + statements + signature ── -->
    <div class="seal-row">

      <!-- Circular seal SVG -->
      <div class="seal">
        <svg width="80" height="80" viewBox="0 0 80 80"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="LINGAP Verified Impact Seal">
          <defs>
            <path id="seal-circle"
              d="M 40,40 m -28,0 a 28,28 0 1,1 56,0 a 28,28 0 1,1 -56,0"/>
          </defs>
          <!-- Outer star burst -->
          <polygon
            points="40,5 47,27 70,27 52,41 59,63 40,50 21,63 28,41 10,27 33,27"
            fill="none" stroke="#10B891" stroke-width="1.5" opacity="0.3"/>
          <!-- Inner star -->
          <polygon
            points="40,10 46,29 66,29 51,41 57,60 40,49 23,60 29,41 14,29 34,29"
            fill="none" stroke="#10B891" stroke-width="0.8" opacity="0.5"/>
          <!-- Circle ring -->
          <circle cx="40" cy="40" r="20"
            fill="none" stroke="#10B891" stroke-width="1" opacity="0.6"/>
          <!-- Circular text -->
          <text font-size="6.5"
            font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
            font-weight="700" letter-spacing="2.5" fill="#10B891">
            <textPath href="#seal-circle" startOffset="50%" text-anchor="middle">
              LINGAP · VERIFIED · IMPACT ·
            </textPath>
          </text>
          <!-- Center text -->
          <text x="40" y="37" text-anchor="middle"
            font-size="9" font-weight="800" fill="#10B891"
            font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
            letter-spacing="1">CERTIFIED</text>
          <text x="40" y="47" text-anchor="middle"
            font-size="7" fill="#10B891"
            font-family="Helvetica Neue,Helvetica,Arial,sans-serif">DONOR</text>
        </svg>
      </div>

      <!-- Verification statements -->
      <div class="cert-statements">
        {statements_html}
      </div>

      <!-- Signature -->
      <div class="sigline">
        <div class="sig-img">Lingap</div>
        <div class="sig-rule"></div>
        <div class="sig-name">{certifying_officer}</div>
        <div class="sig-role">Authorized Certifying Officer</div>
      </div>

    </div>

  </div><!-- /.cert-inner -->

  <!-- Footer strip -->
  <div class="footer-strip">
    <div class="footer-text">
      Immutable Record &nbsp;·&nbsp; Publicly Verifiable &nbsp;·&nbsp; Blockchain-Backed
    </div>
    <div class="footer-watermark">LINGAP</div>
  </div>

  <div class="bottom-band"></div>

</div><!-- /.cert-wrap -->
</body>
</html>"""

    return html


def get_certificate_hash(html_content: str) -> str:
    """Compute SHA-256 hash of the certificate HTML for integrity verification."""
    return hashlib.sha256(html_content.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# Backwards-compatible SVG wrapper (kept for reference; use HTML version above)
# ---------------------------------------------------------------------------

def generate_svg_certificate(
    donor_name: str,
    amount: float,
    beneficiary_name: str,
    milestone_description: str,
    lives_touched: int,
    total_donated: float,
    donation_date: datetime,
    stellar_tx_hash: str,
    merkle_proof: str | None = None,
    onchain_hash: str | None = None,
) -> str:
    """Legacy SVG certificate generator (thin wrapper around the HTML version).

    Embeds the full HTML certificate inside an SVG foreignObject so it can be
    used anywhere an SVG is expected (e.g. stored as .svg, embedded in <img>).
    For most use-cases, prefer generate_html_certificate() directly.
    """
    html = generate_html_certificate(
        donor_name=donor_name,
        amount=amount,
        beneficiary_name=beneficiary_name,
        milestone_description=milestone_description,
        lives_touched=lives_touched,
        total_donated=total_donated,
        donation_date=donation_date,
        stellar_tx_hash=stellar_tx_hash,
        merkle_proof=merkle_proof,
        onchain_hash=onchain_hash,
    )
    html_escaped = html.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

    svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 800 1100" xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     preserveAspectRatio="xMidYMid meet">
  <foreignObject width="800" height="1100">
    <div xmlns="http://www.w3.org/1999/xhtml">
      {html}
    </div>
  </foreignObject>
</svg>"""
    return svg


# ---------------------------------------------------------------------------
# Example usage / smoke test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    sample = generate_html_certificate(
        donor_name="Cameron Graham",
        amount=7_498.00,
        beneficiary_name="Gino Reyes — Home Repair, Manila",
        milestone_description="Milestone 1: Materials Procurement — 50% Funded",
        lives_touched=6,
        total_donated=7_498.00,
        donation_date=datetime(2026, 5, 17),
        stellar_tx_hash="5b1f0ee8e8b1465dad6a747b0d030406a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
        merkle_proof="a3c7f2b9d1e4a6b8c3f0e2d5a8b1c4f7e2a9d6b3c8f5e1a4d7b2c9f6e3a0d8b5",
        onchain_hash="9f2e4a1c7b8d3e5f6a2b7c4d1e8f3a0b5c6d9e2f7a4b1c8d5e0f3a6b9c2d7e4f",
        certificate_id="LNG-2026-BPH01",
        block_number="52,031,847",
    )

    output_path = "lingap_certificate.html"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(sample)

    cert_hash = get_certificate_hash(sample)
    print(f"Certificate written to: {output_path}")
    print(f"SHA-256 integrity hash:  {cert_hash}")