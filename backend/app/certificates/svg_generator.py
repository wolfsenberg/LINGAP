"""SVG certificate generation with responsive template and PNG fallback wrapper."""
from datetime import datetime
import hashlib


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
    """Generate responsive SVG certificate.

    Args:
        donor_name: Donor name
        amount: Donation amount
        beneficiary_name: Beneficiary name
        milestone_description: Milestone (e.g., "Chemo Cycle 3")
        lives_touched: Count of lives helped
        total_donated: Total amount donated by this donor
        donation_date: Date of donation
        stellar_tx_hash: Stellar blockchain transaction hash
        merkle_proof: Optional merkle proof for verification
        onchain_hash: Optional on-chain hash reference

    Returns:
        SVG as string with embedded data
    """
    tx_preview = stellar_tx_hash[:32] + "..."
    date_str = donation_date.strftime("%B %d, %Y")

    svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B891;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.15" />
    </filter>
    <style>
      .cert-title {{ font-family: 'Helvetica', 'Arial', sans-serif; font-weight: bold; letter-spacing: 0.5px; }}
      .cert-heading {{ font-family: 'Helvetica', 'Arial', sans-serif; font-weight: 300; }}
      .cert-amount {{ font-family: 'Helvetica', 'Arial', sans-serif; font-weight: bold; }}
      .cert-footer {{ font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; fill: #6B7280; }}
      .cert-hash {{ font-family: 'Monaco', 'Courier New', monospace; font-size: 10px; fill: #4B5563; }}
    </style>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1350" fill="white"/>

  <!-- Top border accent -->
  <rect x="40" y="40" width="1000" height="4" fill="url(#gradient1)" filter="url(#shadow)"/>

  <!-- Title Section -->
  <text x="540" y="120" font-size="24" text-anchor="middle" class="cert-title" fill="#10B891">
    CERTIFICATE OF HUMANITARIAN IMPACT
  </text>

  <!-- Brand -->
  <text x="540" y="200" font-size="48" text-anchor="middle" class="cert-title" fill="#0F172A">
    LINGAP
  </text>

  <text x="540" y="240" font-size="14" text-anchor="middle" class="cert-heading" fill="#6B7280">
    Ledger for Integrity, Need-based Giving, Aid Provenance &amp; Protection
  </text>

  <!-- Divider -->
  <line x1="120" y1="280" x2="960" y2="280" stroke="#E5E7EB" stroke-width="1"/>

  <!-- Certificate Body -->
  <text x="540" y="340" font-size="16" text-anchor="middle" class="cert-heading" fill="#4B5563">
    This certifies that
  </text>

  <text x="540" y="420" font-size="44" text-anchor="middle" class="cert-title" fill="#0F172A">
    {donor_name}
  </text>

  <text x="540" y="480" font-size="16" text-anchor="middle" class="cert-heading" fill="#4B5563">
    has made a verified, blockchain-recorded donation of
  </text>

  <!-- Amount Highlight -->
  <rect x="280" y="510" width="520" height="90" fill="#F0F9F7" rx="8"/>
  <text x="540" y="580" font-size="64" text-anchor="middle" class="cert-amount" fill="#10B891">
    ₱{amount:,.2f}
  </text>

  <!-- Beneficiary Section -->
  <text x="540" y="670" font-size="16" text-anchor="middle" class="cert-heading" fill="#4B5563">
    in support of the verified campaign
  </text>

  <text x="540" y="730" font-size="20" text-anchor="middle" class="cert-title" fill="#0F172A">
    {beneficiary_name}
  </text>

  <text x="540" y="790" font-size="14" text-anchor="middle" class="cert-heading" fill="#4B5563">
    <tspan font-weight="bold">Milestone:</tspan> {milestone_description}
  </text>

  <!-- Metrics Card -->
  <rect x="80" y="830" width="920" height="120" fill="#F9FAFB" stroke="#E5E7EB" stroke-width="1" rx="6"/>

  <!-- Metrics Grid -->
  <g font-size="13" class="cert-heading" fill="#6B7280">
    <text x="190" y="860" text-anchor="middle" font-weight="bold" fill="#0F172A">Lives Touched</text>
    <text x="190" y="895" font-size="18" text-anchor="middle" class="cert-amount" fill="#10B891">{lives_touched}</text>

    <text x="540" y="860" text-anchor="middle" font-weight="bold" fill="#0F172A">Total Donated</text>
    <text x="540" y="895" font-size="18" text-anchor="middle" class="cert-amount" fill="#10B891">₱{total_donated:,.2f}</text>

    <text x="890" y="860" text-anchor="middle" font-weight="bold" fill="#0F172A">This Donation</text>
    <text x="890" y="895" font-size="18" text-anchor="middle" class="cert-amount" fill="#10B891">₱{amount:,.2f}</text>
  </g>

  <!-- Blockchain Verification Section -->
  <text x="540" y="1020" font-size="14" text-anchor="middle" class="cert-title" fill="#0F172A">
    STELLAR BLOCKCHAIN VERIFICATION
  </text>

  <line x1="200" y1="1050" x2="880" y2="1050" stroke="#E5E7EB" stroke-width="1"/>

  <!-- Transaction Reference -->
  <text x="100" y="1100" font-size="12" class="cert-heading" fill="#0F172A">
    <tspan font-weight="bold">Tx Hash:</tspan>
  </text>
  <text x="100" y="1130" font-size="11" class="cert-hash">
    {tx_preview}
  </text>

  <text x="100" y="1180" font-size="12" class="cert-heading" fill="#0F172A">
    <tspan font-weight="bold">Date:</tspan>
  </text>
  <text x="100" y="1210" font-size="11" class="cert-heading" fill="#4B5563">
    {date_str}
  </text>

  {f'''  <!-- Merkle Proof -->
  <text x="100" y="1260" font-size="12" class="cert-heading" fill="#0F172A">
    <tspan font-weight="bold">Merkle Proof:</tspan>
  </text>
  <text x="100" y="1290" font-size="10" class="cert-hash">
    {merkle_proof[:48]}...
  </text>''' if merkle_proof else ""}

  {f'''  <!-- On-Chain Hash -->
  <text x="580" y="1100" font-size="12" class="cert-heading" fill="#0F172A">
    <tspan font-weight="bold">On-Chain Hash:</tspan>
  </text>
  <text x="580" y="1130" font-size="10" class="cert-hash">
    {onchain_hash[:48]}...
  </text>''' if onchain_hash else ""}

  <!-- Footer -->
  <text x="540" y="1320" font-size="13" text-anchor="middle" class="cert-heading" fill="#6B7280">
    Immutable Record • Publicly Verifiable • Blockchain-Backed
  </text>

  <!-- Bottom border -->
  <rect x="40" y="1340" width="1000" height="4" fill="url(#gradient1)"/>
</svg>"""

    return svg


def get_svg_hash(svg_content: str) -> str:
    """Compute SHA256 hash of SVG content."""
    return hashlib.sha256(svg_content.encode()).hexdigest()


def wrap_svg_with_png_fallback(svg_content: str, donation_id: str) -> str:
    """Wrap SVG with PNG fallback for social previews.

    Returns HTML container suitable for embedding or serving as data URI.
    The actual PNG would be pre-generated and stored separately.
    """
    svg_escaped = svg_content.replace('"', '&quot;').replace("'", "&#39;")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta property="og:title" content="Humanitarian Impact Certificate - LINGAP">
    <meta property="og:description" content="Blockchain-verified donation certificate">
    <meta property="og:type" content="image/svg+xml">
    <meta name="twitter:card" content="summary_large_image">
    <title>Certificate - Donation {{donation_id}}</title>
    <style>
        body {{ margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }}
        .container {{ max-width: 1080px; margin: 20px auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }}
        .certificate {{ width: 100%; height: auto; display: block; }}
        .fallback-png {{ display: none; }}
        @media (prefers-reduced-motion: no-preference) {{
            .container {{ animation: fadeIn 0.3s ease-in; }}
        }}
        @keyframes fadeIn {{
            from {{ opacity: 0; transform: translateY(10px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <svg class="certificate" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
            <!-- SVG fallback for rendering -->
            <image href="data:image/svg+xml,{svg_escaped}" width="100%" height="100%"/>
        </svg>
        <!-- PNG fallback for social preview (pre-generated URL) -->
        <img class="fallback-png" src="/api/v1/certificates/{{donation_id}}/preview.png" alt="Certificate Preview">
    </div>
    <script>
        // Client-side SVG rendering optimization
        document.querySelector('.certificate').innerHTML = `{svg_content}`;
    </script>
</body>
</html>"""

    return html
