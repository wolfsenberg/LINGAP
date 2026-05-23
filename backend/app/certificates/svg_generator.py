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
    """Generate a polished HTML certificate for a LINGAP donation."""
    date_str = donation_date.strftime("%B %d, %Y")
    tx_preview = stellar_tx_hash[:20] + "..."
    merkle_preview = (merkle_proof[:20] + "...") if merkle_proof else "N/A"
    onchain_preview = (onchain_hash[:20] + "...") if onchain_hash else "N/A"

    if not certificate_id:
        short = hashlib.sha256(stellar_tx_hash.encode()).hexdigest()[:6].upper()
        year = donation_date.year
        certificate_id = f"LNG-{year}-{short}"

    block_display = f" &middot; Block {block_number}" if block_number else ""

    verification_statements = [
        "Blockchain transaction verified on Stellar Mainnet",
        "Beneficiary campaign identity independently confirmed",
        "Funds disbursed directly to verified medical providers",
        "Immutable record - publicly accessible at any time",
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
  <meta property="og:title" content="LINGAP Certificate of Humanitarian Impact - {donor_name}">
  <meta property="og:description" content="Blockchain-verified donation of ?{amount:,.2f} to {beneficiary_name}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <title>LINGAP Certificate - {certificate_id}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

    :root {{
      --green-deep:   #064E3B;
      --green-mid:    #059669;
      --green-bright: #10B981;
      --green-light:  #D1FAE5;
      --green-pale:   #ECFDF5;
      --gold:         #B45309;
      --gold-light:   #FEF3C7;
      --gold-pale:    #FFFBEB;
      --ink:          #0C1A12;
      --ink-mid:      #1C3A28;
      --slate:        #475569;
      --muted:        #94A3B8;
      --rule:         #E2E8F0;
      --bg:           #F0F7F4;
    }}

    body {{
      background: var(--bg);
      font-family: 'DM Sans', sans-serif;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 40px 16px;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }}

    .cert-wrap {{
      width: 100%;
      max-width: 820px;
      background: #fff;
      border-radius: 4px;
      overflow: hidden;
      box-shadow:
        0 0 0 1px rgba(0,0,0,0.06),
        0 8px 48px rgba(6,78,59,0.10),
        0 2px 8px rgba(0,0,0,0.06);
      position: relative;
    }}

    .cert-wrap::before {{
      content: '';
      position: absolute;
      inset: 10px;
      border: 1px solid rgba(16,185,129,0.15);
      border-radius: 2px;
      pointer-events: none;
      z-index: 1;
    }}

    .top-band {{
      height: 8px;
      background: linear-gradient(90deg, var(--green-deep) 0%, var(--green-bright) 50%, var(--green-deep) 100%);
    }}

    .cert-bg {{
      position: absolute;
      inset: 0;
      opacity: 0.025;
      background-image:
        radial-gradient(circle at 15% 50%, var(--green-bright) 0%, transparent 60%),
        radial-gradient(circle at 85% 20%, var(--green-bright) 0%, transparent 50%);
      pointer-events: none;
      z-index: 0;
    }}

    .cert-inner {{
      padding: 52px 64px 44px;
      position: relative;
      z-index: 2;
    }}

    .header-row {{
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 40px;
    }}

    .brand {{
      display: flex;
      align-items: center;
      gap: 16px;
    }}

    .brand-mark {{
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--green-deep) 0%, var(--green-mid) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(6,78,59,0.30);
    }}

    .brand-name {{
      font-family: 'DM Sans', sans-serif;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 5px;
      color: var(--ink);
      line-height: 1;
    }}

    .brand-tagline {{
      font-size: 9.5px;
      color: var(--muted);
      letter-spacing: 0.3px;
      margin-top: 4px;
      line-height: 1.5;
      max-width: 260px;
      font-weight: 400;
    }}

    .cert-label {{
      text-align: right;
    }}

    .cert-label-title {{
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 3px;
      color: var(--green-mid);
      text-transform: uppercase;
    }}

    .cert-label-sub {{
      font-family: 'Cormorant Garamond', serif;
      font-size: 13px;
      font-style: italic;
      color: var(--slate);
      margin-top: 3px;
    }}

    .cert-id {{
      font-family: 'DM Mono', monospace;
      font-size: 9px;
      color: #CBD5E1;
      margin-top: 4px;
      letter-spacing: 0.5px;
    }}

    .ornament-divider {{
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 40px;
    }}

    .ornament-rule {{
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--rule) 40%, var(--rule) 60%, transparent);
    }}

    .ornament-diamond {{
      width: 6px;
      height: 6px;
      background: var(--green-bright);
      transform: rotate(45deg);
      flex-shrink: 0;
    }}

    .ornament-dot {{
      width: 3px;
      height: 3px;
      background: var(--green-light);
      border-radius: 50%;
      flex-shrink: 0;
    }}

    .certifies-line {{
      font-family: 'Cormorant Garamond', serif;
      font-size: 14px;
      font-style: italic;
      letter-spacing: 1px;
      color: var(--muted);
      text-align: center;
      margin-bottom: 10px;
    }}

    .donor-name {{
      font-family: 'Cormorant Garamond', serif;
      font-size: 52px;
      font-weight: 600;
      color: var(--ink);
      text-align: center;
      letter-spacing: -0.5px;
      line-height: 1.05;
      margin-bottom: 16px;
    }}

    .made-line {{
      font-size: 12.5px;
      color: var(--slate);
      text-align: center;
      margin-bottom: 28px;
      line-height: 1.7;
      font-weight: 400;
      max-width: 480px;
      margin-left: auto;
      margin-right: auto;
    }}

    .amount-block {{
      background: linear-gradient(135deg, var(--green-pale) 0%, #fff 100%);
      border: 1.5px solid var(--green-light);
      border-radius: 14px;
      padding: 22px 36px;
      text-align: center;
      margin: 0 auto 36px;
      max-width: 320px;
      position: relative;
      overflow: hidden;
    }}

    .amount-block::before {{
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--green-mid), var(--green-bright));
    }}

    .amount-label {{
      font-size: 9px;
      letter-spacing: 2.5px;
      color: var(--green-mid);
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 8px;
    }}

    .amount-value {{
      font-family: 'Cormorant Garamond', serif;
      font-size: 58px;
      font-weight: 700;
      color: var(--green-deep);
      line-height: 1;
      letter-spacing: -1px;
    }}

    .for-line {{
      font-family: 'Cormorant Garamond', serif;
      font-size: 13px;
      font-style: italic;
      letter-spacing: 0.5px;
      color: var(--muted);
      text-align: center;
      margin-bottom: 8px;
    }}

    .beneficiary {{
      font-family: 'Cormorant Garamond', serif;
      font-size: 26px;
      font-weight: 600;
      color: var(--ink);
      text-align: center;
      margin-bottom: 12px;
    }}

    .milestone-wrapper {{
      text-align: center;
      margin-bottom: 40px;
    }}

    .milestone-badge {{
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: var(--gold-pale);
      border: 1px solid #FDE68A;
      border-radius: 20px;
      padding: 6px 16px;
      font-size: 11px;
      color: var(--gold);
      font-weight: 500;
      letter-spacing: 0.3px;
    }}

    .milestone-dot {{
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--gold);
      flex-shrink: 0;
    }}

    .metrics-row {{
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 14px;
      margin-bottom: 36px;
    }}

    .metric-card {{
      background: #F8FAFC;
      border: 1px solid var(--rule);
      border-radius: 12px;
      padding: 18px 14px;
      text-align: center;
      transition: border-color 0.2s;
    }}

    .metric-card:hover {{
      border-color: var(--green-light);
    }}

    .metric-icon {{
      color: var(--green-bright);
      margin-bottom: 8px;
      display: flex;
      justify-content: center;
    }}

    .metric-label {{
      font-size: 9.5px;
      letter-spacing: 1.5px;
      color: var(--muted);
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 5px;
    }}

    .metric-value {{
      font-family: 'Cormorant Garamond', serif;
      font-size: 28px;
      font-weight: 700;
      color: var(--ink);
      line-height: 1;
    }}

    .metric-value.small {{
      font-size: 15px;
      font-family: 'DM Sans', sans-serif;
      font-weight: 600;
      padding-top: 4px;
      letter-spacing: -0.2px;
    }}

    .blockchain-section {{
      background: var(--ink);
      border-radius: 14px;
      padding: 26px 30px;
      margin-bottom: 36px;
    }}

    .bc-header {{
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 18px;
    }}

    .bc-dot {{
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--green-bright);
      flex-shrink: 0;
      box-shadow: 0 0 6px var(--green-bright);
    }}

    .bc-title {{
      font-size: 9.5px;
      letter-spacing: 2.5px;
      color: var(--green-bright);
      text-transform: uppercase;
      font-weight: 600;
    }}

    .bc-live {{
      margin-left: auto;
      font-size: 8.5px;
      color: var(--green-bright);
      letter-spacing: 1.5px;
      background: rgba(16, 185, 129, 0.10);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 10px;
      padding: 3px 10px;
      font-weight: 600;
    }}

    .bc-divider {{
      height: 1px;
      background: rgba(255,255,255,0.06);
      margin-bottom: 18px;
    }}

    .bc-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px 24px;
    }}

    .bc-field-label {{
      font-size: 8.5px;
      letter-spacing: 1.5px;
      color: #475569;
      text-transform: uppercase;
      margin-bottom: 5px;
      font-weight: 600;
    }}

    .bc-field-value {{
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      color: #94A3B8;
      word-break: break-all;
      line-height: 1.6;
    }}

    .bc-field-value.highlight {{
      color: var(--green-bright);
    }}

    .seal-row {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 28px;
      padding-top: 4px;
    }}

    .seal {{
      width: 88px;
      height: 88px;
      flex-shrink: 0;
    }}

    .cert-statements {{
      flex: 1;
    }}

    .statement-line {{
      display: flex;
      align-items: center;
      gap: 9px;
      font-size: 11px;
      color: var(--slate);
      margin-bottom: 8px;
      line-height: 1.4;
    }}

    .statement-check {{
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: var(--green-pale);
      border: 1px solid var(--green-light);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }}

    .sigline {{
      text-align: right;
      min-width: 160px;
    }}

    .sig-img {{
      font-family: 'Cormorant Garamond', serif;
      font-size: 34px;
      font-style: italic;
      font-weight: 400;
      color: var(--ink);
      line-height: 1;
      margin-bottom: 6px;
    }}

    .sig-rule {{
      width: 120px;
      height: 1px;
      background: var(--rule);
      margin-left: auto;
      margin-bottom: 5px;
    }}

    .sig-name {{
      font-size: 10.5px;
      font-weight: 700;
      color: var(--ink);
      letter-spacing: 0.2px;
    }}

    .sig-role {{
      font-size: 9px;
      color: var(--muted);
      margin-top: 1px;
    }}

    .footer-strip {{
      background: #F8FAFC;
      padding: 12px 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--rule);
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
      letter-spacing: 3px;
    }}

    .bottom-band {{
      height: 8px;
      background: linear-gradient(90deg, var(--green-deep) 0%, var(--green-bright) 50%, var(--green-deep) 100%);
    }}

    @media print {{
      body {{ background: white; padding: 0; }}
      .cert-wrap {{ box-shadow: none; max-width: 100%; }}
    }}

    @media (max-width: 600px) {{
      .cert-inner {{ padding: 36px 28px 32px; }}
      .donor-name {{ font-size: 36px; }}
      .amount-value {{ font-size: 44px; }}
      .metrics-row {{ grid-template-columns: 1fr; }}
      .bc-grid {{ grid-template-columns: 1fr; }}
      .seal-row {{ flex-direction: column; align-items: flex-start; }}
      .sigline {{ text-align: left; min-width: unset; }}
      .sig-rule {{ margin-left: 0; }}
      .header-row {{ flex-direction: column; gap: 14px; }}
      .cert-label {{ text-align: left; }}
      .footer-strip {{ padding: 12px 28px; }}
    }}
  </style>
</head>
<body>
<div class="cert-wrap">
  <div class="cert-bg"></div>

  <div class="top-band"></div>

  <div class="cert-inner">

    <div class="header-row">
      <div class="brand">
        <div class="brand-mark">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="14" y="21" text-anchor="middle"
              font-size="20" font-weight="800"
              font-family="DM Sans,Helvetica,Arial,sans-serif"
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

    <div class="ornament-divider">
      <div class="ornament-rule"></div>
      <div class="ornament-dot"></div>
      <div class="ornament-diamond"></div>
      <div class="ornament-dot"></div>
      <div class="ornament-rule"></div>
    </div>

    <div class="certifies-line">This certifies that</div>
    <div class="donor-name">{donor_name}</div>
    <div class="made-line">
      has made a verified, blockchain-recorded donation in support of a humanitarian cause
    </div>

    <div class="amount-block">
      <div class="amount-label">Verified Donation</div>
      <div class="amount-value">&#8369;{amount:,.2f}</div>
    </div>

    <div class="for-line">in benefit of the campaign of</div>
    <div class="beneficiary">{beneficiary_name}</div>
    <div class="milestone-wrapper">
      <span class="milestone-badge">
        <span class="milestone-dot"></span>
        Milestone: {milestone_description}
      </span>
    </div>

    <div class="metrics-row">

      <div class="metric-card">
        <div class="metric-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.6"
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
            stroke="currentColor" stroke-width="1.6"
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
            stroke="currentColor" stroke-width="1.6"
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

    <div class="blockchain-section">
      <div class="bc-header">
        <div class="bc-dot"></div>
        <div class="bc-title">Stellar Blockchain Verification</div>
        <div class="bc-live">&#9679;&nbsp;VERIFIED</div>
      </div>
      <div class="bc-divider"></div>
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

    <div class="seal-row">

      <div class="seal">
        <svg width="88" height="88" viewBox="0 0 88 88"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="LINGAP Verified Impact Seal">
          <defs>
            <path id="seal-circle"
              d="M 44,44 m -31,0 a 31,31 0 1,1 62,0 a 31,31 0 1,1 -62,0"/>
            <radialGradient id="sealGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ECFDF5"/>
              <stop offset="100%" stop-color="#fff"/>
            </radialGradient>
          </defs>
          <circle cx="44" cy="44" r="42" fill="url(#sealGrad)" stroke="#D1FAE5" stroke-width="1"/>
          <circle cx="44" cy="44" r="38"
            fill="none" stroke="#10B981" stroke-width="0.8"
            stroke-dasharray="3 4" opacity="0.5"/>
          <polygon
            points="44,6 52,30 77,30 57,46 65,70 44,55 23,70 31,46 11,30 36,30"
            fill="none" stroke="#10B981" stroke-width="1.2" opacity="0.2"/>
          <circle cx="44" cy="44" r="23"
            fill="none" stroke="#10B981" stroke-width="0.8" opacity="0.4"/>
          <text font-size="6.5"
            font-family="DM Sans,Helvetica,Arial,sans-serif"
            font-weight="700" letter-spacing="2.8" fill="#059669">
            <textPath href="#seal-circle" startOffset="50%" text-anchor="middle">
              LINGAP &middot; VERIFIED &middot; IMPACT &middot;
            </textPath>
          </text>
          <text x="44" y="41" text-anchor="middle"
            font-size="9" font-weight="700" fill="#064E3B"
            font-family="DM Sans,Helvetica,Arial,sans-serif"
            letter-spacing="1.5">CERTIFIED</text>
          <text x="44" y="52" text-anchor="middle"
            font-size="7.5" fill="#059669"
            font-family="DM Sans,Helvetica,Arial,sans-serif"
            letter-spacing="1">DONOR</text>
        </svg>
      </div>

      <div class="cert-statements">
        {statements_html}
      </div>

      <div class="sigline">
        <div class="sig-img">Lingap</div>
        <div class="sig-rule"></div>
        <div class="sig-name">{certifying_officer}</div>
        <div class="sig-role">Authorized Certifying Officer</div>
      </div>

    </div>

  </div>

  <div class="footer-strip">
    <div class="footer-text">
      Immutable Record &nbsp;&middot;&nbsp; Publicly Verifiable &nbsp;&middot;&nbsp; Blockchain-Backed
    </div>
    <div class="footer-watermark">LINGAP</div>
  </div>

  <div class="bottom-band"></div>

</div>
</body>
</html>"""

    return html


def get_certificate_hash(html_content: str) -> str:
    """Compute SHA-256 hash of the certificate HTML for integrity verification."""
    return hashlib.sha256(html_content.encode("utf-8")).hexdigest()


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
    """Legacy SVG certificate generator wrapper around HTML template."""
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
<<<<<<< HEAD

    return f"""<?xml version="1.0" encoding="UTF-8"?>
=======
    svg = f"""<?xml version="1.0" encoding="UTF-8"?>
>>>>>>> caef5d7d3180e59bb68f4adaba5821d3545663e9
<svg viewBox="0 0 800 1100" xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     preserveAspectRatio="xMidYMid meet">
  <foreignObject width="800" height="1100">
    <div xmlns="http://www.w3.org/1999/xhtml">
      {html}
    </div>
  </foreignObject>
</svg>"""


if __name__ == "__main__":
    sample = generate_html_certificate(
        donor_name="Cameron Graham",
        amount=7_498.00,
        beneficiary_name="Gino Reyes - Home Repair, Manila",
        milestone_description="Milestone 1: Materials Procurement - 50% Funded",
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
<<<<<<< HEAD

=======
>>>>>>> caef5d7d3180e59bb68f4adaba5821d3545663e9
