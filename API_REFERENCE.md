# On-Chain Donation Certificate API Reference

## Overview

The On-Chain Certificate API provides endpoints to generate, retrieve, and verify blockchain-backed donation certificates. Certificates are stored as responsive SVG files on a public S3 bucket and indexed in the database for fast retrieval.

---

## Authentication

All endpoints require Bearer token authentication (JWT).

```bash
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### 1. Generate On-Chain Certificate

**Endpoint:** `POST /api/v1/certificates/generate-onchain`

**Authentication:** Required (Bearer Token)

**Description:** Generate a blockchain-verified donation certificate. This endpoint:
1. Verifies the Stellar transaction on-chain via Horizon API
2. Generates a responsive SVG certificate with all donation metadata
3. Creates an HTML wrapper for social preview (OpenGraph tags)
4. Uploads both files to public S3 bucket
5. Saves metadata to database with blockchain verification details
6. Returns public URLs and verification chain

**Request Body:**

```json
{
  "stellar_tx_hash": "string (required)",
  "donation_id": "uuid (required)",
  "merkle_proof": "string (optional)",
  "onchain_hash": "string (optional)"
}
```

**Request Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stellar_tx_hash` | String | ✓ | Stellar blockchain transaction hash (64 chars) |
| `donation_id` | UUID | ✓ | ID of the donation to create certificate for |
| `merkle_proof` | String | ✗ | Optional merkle proof for verification chain |
| `onchain_hash` | String | ✗ | Optional on-chain hash (e.g., Soroban contract state hash) |

**Response (201 Created):**

```json
{
  "certificate_id": "550e8400-e29b-41d4-a716-446655440000",
  "svg_s3_url": "https://lingap-certificates-prod.s3.us-east-1.amazonaws.com/certificates/550e8400-e29b-41d4-a716-446655440000/certificate-abc123def456.svg",
  "html_s3_url": "https://lingap-certificates-prod.s3.us-east-1.amazonaws.com/certificates/550e8400-e29b-41d4-a716-446655440000/certificate.html",
  "svg_hash": "abc123def456...full_sha256_hash",
  "verified": true,
  "tx_verified": true,
  "stellar_ledger": 12345678,
  "merkle_proof": "optional_proof_chain_data",
  "onchain_hash": "optional_contract_state_hash",
  "cert_integrity_hash": "sha256_of_certificate_metadata"
}
```

**Response Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `certificate_id` | UUID | Unique identifier for the certificate in database |
| `svg_s3_url` | String | Public URL to download SVG certificate from S3 |
| `html_s3_url` | String | Public URL to HTML wrapper with embedded SVG (for social sharing) |
| `svg_hash` | String | SHA256 hash of SVG content for integrity verification |
| `verified` | Boolean | Whether certificate has been created with blockchain verification |
| `tx_verified` | Boolean | Whether Stellar transaction was successfully verified |
| `stellar_ledger` | Integer | Stellar ledger sequence number for transaction (immutable proof of inclusion) |
| `merkle_proof` | String | Echoed back from request (for merkle tree verification chain) |
| `onchain_hash` | String | Echoed back from request (for smart contract verification) |
| `cert_integrity_hash` | String | SHA256(svg_hash + tx_hash + ledger) for certificate authenticity |

**Error Responses:**

```json
// 404 Not Found - Donation does not exist
{
  "detail": "Donation not found"
}

// 403 Forbidden - User is not the donor
{
  "detail": "Only the donor can generate a certificate for this donation"
}

// 400 Bad Request - Certificate already exists or Stellar verification failed
{
  "detail": "Certificate already exists for this donation"
}

// 500 Internal Server Error - S3 upload or service failure
{
  "detail": "Certificate generation failed: S3 upload failed: ..."
}
```

**cURL Example:**

```bash
curl -X POST https://api.lingap.com/api/v1/certificates/generate-onchain \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stellar_tx_hash": "abc123def456xyz789abc123def456xyz789abc123def456xyz789abc123",
    "donation_id": "550e8400-e29b-41d4-a716-446655440000",
    "merkle_proof": null,
    "onchain_hash": null
  }'
```

**JavaScript/TypeScript Example:**

```typescript
const response = await fetch('/api/v1/certificates/generate-onchain', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    stellar_tx_hash: 'abc123...',
    donation_id: '550e8400-e29b-41d4-a716-446655440000',
    merkle_proof: null,
    onchain_hash: null
  })
});

const cert = await response.json();
console.log('Certificate generated:', cert.certificate_id);
console.log('Public SVG URL:', cert.svg_s3_url);
```

**Python Example:**

```python
import requests
from uuid import UUID

cert_request = {
    "stellar_tx_hash": "abc123...",
    "donation_id": str(UUID('550e8400-e29b-41d4-a716-446655440000')),
    "merkle_proof": None,
    "onchain_hash": None
}

headers = {
    "Authorization": f"Bearer {jwt_token}",
    "Content-Type": "application/json"
}

response = requests.post(
    "https://api.lingap.com/api/v1/certificates/generate-onchain",
    json=cert_request,
    headers=headers
)

cert = response.json()
print(f"SVG URL: {cert['svg_s3_url']}")
```

---

### 2. Get On-Chain Certificate Details

**Endpoint:** `GET /api/v1/certificates/onchain/{cert_id}`

**Authentication:** Required (Bearer Token, but public if `is_public=true`)

**Description:** Retrieve full details of a certificate including blockchain verification metadata.

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `cert_id` | UUID | Certificate ID |

**Response (200 OK):**

```json
{
  "certificate_id": "550e8400-e29b-41d4-a716-446655440000",
  "svg_s3_url": "https://lingap-certificates-prod.s3.us-east-1.amazonaws.com/...",
  "html_s3_url": "https://lingap-certificates-prod.s3.us-east-1.amazonaws.com/...",
  "svg_hash": "abc123def456...",
  "verified": true,
  "tx_verified": true,
  "stellar_ledger": 12345678,
  "merkle_proof": "optional_proof_data",
  "onchain_hash": "optional_hash_data",
  "cert_integrity_hash": ""
}
```

**Error Responses:**

```json
// 404 Not Found
{ "detail": "Certificate not found" }

// 403 Forbidden - Certificate is private and user is not owner
{ "detail": "Not authorized to view this certificate" }
```

**cURL Example:**

```bash
curl https://api.lingap.com/api/v1/certificates/onchain/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Certificate Data Structure

### SVG Certificate Content

The generated SVG certificate includes:

```
┌─────────────────────────────────────────────┐
│   CERTIFICATE OF HUMANITARIAN IMPACT        │
│                                              │
│                   LINGAP                     │
│   Ledger for Integrity, Need-based Giving   │
├─────────────────────────────────────────────┤
│  This certifies that                         │
│                                              │
│            DONOR NAME                        │
│                                              │
│  has made a verified, blockchain-recorded   │
│  donation of                                 │
│                                              │
│         ₱ AMOUNT                             │
│                                              │
│  in support of the verified campaign        │
│                                              │
│         BENEFICIARY NAME                     │
│  Milestone: MILESTONE DESCRIPTION            │
├─────────────────────────────────────────────┤
│  Lives Touched | Total Donated | This Donation
│      COUNT     |     ₱TOTAL    |    ₱AMOUNT   │
├─────────────────────────────────────────────┤
│  STELLAR BLOCKCHAIN VERIFICATION            │
│  Tx Hash: abc123def456...                   │
│  Date: Month DD, YYYY                        │
│  [Merkle Proof & On-Chain Hash if provided] │
├─────────────────────────────────────────────┤
│  Immutable Record • Publicly Verifiable      │
│  Blockchain-Backed                           │
└─────────────────────────────────────────────┘
```

### Placeholders and Variables

| Placeholder | Source | Example |
|-------------|--------|---------|
| `{donor_name}` | User name or email | "Maria Santos" |
| `{amount}` | Donation amount | "5,000.00" |
| `{beneficiary_name}` | Campaign name | "Medical Relief Fund" |
| `{milestone_description}` | Campaign milestone | "Chemo Cycle 3" |
| `{lives_touched}` | Count of beneficiaries | "47" |
| `{total_donated}` | Cumulative donations | "125,000.00" |
| `{date}` | Donation date | "January 15, 2025" |
| `{tx_preview}` | First 32 chars of tx hash | "abc123def456xyz789abc123def456xy..." |
| `{merkle_proof}` | Optional verification data | "0x5a7f..." |
| `{onchain_hash}` | Optional contract hash | "0x8b2e..." |

---

## Social Sharing & Previews

The HTML wrapper includes OpenGraph and Twitter Card meta tags for automatic preview generation when sharing on social media:

```html
<meta property="og:title" content="Humanitarian Impact Certificate - LINGAP">
<meta property="og:description" content="Blockchain-verified donation certificate">
<meta property="og:image" content="https://lingap-certificates-prod.s3.../preview.png">
<meta property="og:type" content="image">
<meta name="twitter:card" content="summary_large_image">
```

When users share the `html_s3_url` on Twitter/Facebook, the certificate displays as a rich preview card.

---

## Verification & Security

### Verifying Certificate Authenticity

1. **SVG Hash Verification:**
   ```python
   import hashlib
   svg_content = requests.get(cert['svg_s3_url']).text
   computed_hash = hashlib.sha256(svg_content.encode()).hexdigest()
   assert computed_hash == cert['svg_hash']  # Integrity verified
   ```

2. **Stellar Transaction Verification:**
   ```python
   from stellar_sdk import Server
   horizon = Server("https://horizon-testnet.stellar.org")
   tx = horizon.transactions().transaction(cert['stellar_tx_hash']).call()
   assert tx['successful']  # Transaction confirmed
   assert tx['ledger'] == cert['stellar_ledger']  # Ledger matches
   ```

3. **Certificate Integrity Hash:**
   ```
   cert_integrity_hash = SHA256(svg_hash + stellar_tx_hash + stellar_ledger)
   # This links SVG content → Stellar transaction → specific ledger block
   # Proves certificate was not retroactively modified
   ```

---

## Rate Limiting

- **Limit**: 100 certificate generations per user per hour
- **Status Code**: 429 Too Many Requests (if exceeded)

---

## Pagination (Future)

For listing endpoints (not yet implemented):
- `?page=1&per_page=20` for result pagination
- `Link: <...?page=2>; rel="next"` header for navigation

---

## Webhook Events (Future)

When certificates are generated, the following events may be published:

```json
{
  "event": "certificate.created",
  "certificate_id": "uuid",
  "donation_id": "uuid",
  "donor_id": "uuid",
  "timestamp": "2025-01-15T10:30:00Z",
  "svg_url": "https://..."
}
```

---

## Error Codes Reference

| Code | Meaning | Action |
|------|---------|--------|
| 201 | Created | Certificate successfully generated |
| 200 | OK | Data retrieved successfully |
| 400 | Bad Request | Invalid input or certificate already exists |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User lacks permission for resource |
| 404 | Not Found | Donation or certificate not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | S3 upload or service failure |
| 503 | Service Unavailable | Stellar network or AWS outage |

---

## Changelog

### v1.0 (Current)
- Generate SVG certificates with blockchain metadata
- Verify Stellar transactions via Horizon API
- Upload to public S3 bucket
- Store verification chain in database
- HTML wrapper for social previews
