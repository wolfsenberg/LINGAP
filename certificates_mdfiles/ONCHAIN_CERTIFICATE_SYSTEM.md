# On-Chain Donation Certificate System - Architecture & Implementation

## System Overview

This system generates blockchain-verified donation certificates using Stellar, dynamic SVG generation, and AWS S3 storage.

### End-to-End Flow

```
User donates XLM on Stellar
    ↓
POST /api/v1/certificates/generate-onchain
    ↓
Stellar tx verification (client.py)
    ↓
SVG certificate generation with metadata
    ↓
HTML wrapper for social previews
    ↓
Async upload to public S3 (2 files)
    ↓
Certificate metadata saved to DB
    ↓
Public URLs returned
    ↓
Render on user's public profile
```

## Components

### 1. Database Model: `DonationCertificate` (Enhanced)

**New Fields:**
- `svg_s3_url` (String, nullable): Public S3 URL to SVG certificate
- `svg_hash` (String(64), nullable): SHA256 hash of SVG content for verification
- `stellar_tx_hash` (String(64), nullable, indexed): Stellar blockchain transaction hash
- `merkle_proof` (Text, nullable): Optional merkle proof for verification chain
- `onchain_hash` (String(64), nullable): Optional on-chain reference hash (e.g., contract state)
- `verified` (Boolean, default=False): Whether certificate has been blockchain-verified

**Migration Required:**
```sql
ALTER TABLE donation_certificates
ADD COLUMN svg_s3_url VARCHAR(1024),
ADD COLUMN svg_hash VARCHAR(64),
ADD COLUMN stellar_tx_hash VARCHAR(64) UNIQUE,
ADD COLUMN merkle_proof TEXT,
ADD COLUMN onchain_hash VARCHAR(64),
ADD COLUMN verified BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_certificates_stellar_tx ON donation_certificates(stellar_tx_hash);
```

### 2. SVG Certificate Generator (`app/certificates/svg_generator.py`)

**Features:**
- Responsive SVG template (viewBox-based, scales to any device)
- Placeholders: `{donor_name}`, `{amount}`, `{beneficiary_name}`, `{milestone_description}`, `{lives_touched}`, `{total_donated}`, `{date}`, `{tx_preview}`, `{merkle_proof}`, `{onchain_hash}`
- Modern gradient design with emerald/navy color scheme
- Inline CSS for social preview compatibility
- HTML wrapper with PNG fallback for OpenGraph/Twitter cards

**Key Functions:**
- `generate_svg_certificate()`: Returns SVG as XML string with all data injected
- `get_svg_hash()`: Computes SHA256 of SVG for integrity verification
- `wrap_svg_with_png_fallback()`: Returns HTML container with embedded SVG and PNG fallback meta tags

### 3. Async S3 Storage (`app/storage/svg_s3.py`)

**Functions:**
- `upload_svg_certificate(svg_content, donation_id)`: Uploads SVG to public S3, returns `StoredSVGCertificate` with public URL
- `upload_certificate_html_wrapper(html_content, donation_id)`: Uploads HTML wrapper for social previews
- `delete_certificate_assets(donation_id)`: Bulk delete all certificate files for a donation

**S3 Configuration:**
- Bucket: Public (no authentication required to read)
- Files cached indefinitely (max-age=31536000)
- Metadata tags for donation_id and content type
- Key structure: `certificates/{donation_id}/certificate-{svg_hash[:16]}.svg`

### 4. On-Chain Certificate Service (`app/certificates/onchain_service.py`)

**Class:** `OnChainCertificateService`

**Method:** `generate_and_store_certificate()`
- Verifies Stellar transaction via `app.stellar.client.verify_transaction()`
- Generates SVG certificate with blockchain metadata
- Creates HTML wrapper with embedded SVG
- Uploads both files to public S3 (async)
- Computes certificate integrity hash (for future merkle proofs)
- Returns verification metadata

### 5. FastAPI Endpoint (`app/api/v1/onchain_certificates.py`)

**Endpoint: POST `/api/v1/certificates/generate-onchain`**

**Request:**
```json
{
  "stellar_tx_hash": "abc123...",
  "donation_id": "uuid",
  "merkle_proof": "optional_proof_chain",
  "onchain_hash": "optional_contract_state_hash"
}
```

**Response (201 Created):**
```json
{
  "certificate_id": "uuid",
  "svg_s3_url": "https://bucket.s3.region.amazonaws.com/certificates/.../certificate.svg",
  "html_s3_url": "https://bucket.s3.region.amazonaws.com/certificates/.../certificate.html",
  "svg_hash": "sha256_hash_of_svg",
  "verified": true,
  "tx_verified": true,
  "stellar_ledger": 12345,
  "merkle_proof": "optional_proof",
  "onchain_hash": "optional_hash",
  "cert_integrity_hash": "sha256(svg_hash + tx_hash + ledger)"
}
```

**Error Handling:**
- 404: Donation not found
- 403: User is not the donor
- 400: Certificate already exists or Stellar verification failed
- 500: S3 upload failure or service error

**GET `/api/v1/certificates/onchain/{cert_id}`**

Retrieve certificate with full verification chain (public if `is_public=true`, private restricted to owner).

## S3 Public Bucket Setup (3-Step Checklist)

### Step 1: Create S3 Bucket with Public Access

```bash
aws s3api create-bucket \
  --bucket lingap-certificates-prod \
  --region us-east-1

# Block public access settings
aws s3api put-public-access-block \
  --bucket lingap-certificates-prod \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

### Step 2: Apply Bucket Policy for Public Read

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::lingap-certificates-prod/certificates/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    }
  ]
}
```

**Apply Policy:**
```bash
aws s3api put-bucket-policy \
  --bucket lingap-certificates-prod \
  --policy file://bucket-policy.json
```

### Step 3: Enable CORS for Web Embedding

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://yourdomain.com", "https://app.yourdomain.com"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

**Apply CORS:**
```bash
aws s3api put-bucket-cors \
  --bucket lingap-certificates-prod \
  --cors-configuration file://cors-config.json
```

**Verify:**
```bash
aws s3api get-bucket-policy --bucket lingap-certificates-prod
aws s3api get-bucket-cors --bucket lingap-certificates-prod
```

---

## Deployment Checklist

1. **Database Migration**
   ```bash
   alembic revision --autogenerate -m "Add on-chain certificate fields"
   alembic upgrade head
   ```

2. **Environment Variables** (add to `.env`)
   ```
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_S3_BUCKET=lingap-certificates-prod
   AWS_REGION=us-east-1
   ```

3. **Install Dependencies**
   ```bash
   pip install boto3 pydantic fastapi
   ```

4. **Test Endpoint**
   ```bash
   curl -X POST http://localhost:8000/api/v1/certificates/generate-onchain \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "stellar_tx_hash": "test_hash",
       "donation_id": "uuid",
       "merkle_proof": null,
       "onchain_hash": null
     }'
   ```

5. **Verify S3 Access**
   ```bash
   curl https://lingap-certificates-prod.s3.us-east-1.amazonaws.com/certificates/test/test.svg
   ```

---

## Performance & Scalability

### Current Architecture
- **Bottleneck**: Stellar verification is sequential (network latency ~1-2s per tx)
- **S3 Upload**: Non-blocking via boto3 async (typically <500ms)
- **SVG Generation**: In-memory string manipulation (~10ms)

### Recommended Alternatives

#### Alternative 1: Async Batch Certificate Generation with Background Job Queue
**Use Case**: High-volume donation campaigns, batch processing

- Use Celery + Redis for async task queue
- Batch 50+ donations into a single job
- Generate and upload certificates in parallel workers
- Webhook callback when certificates are ready
- Reduces individual request latency from 3s → 200ms (end-user perceives immediate success)

**Implementation:**
```python
@app.post("/api/v1/certificates/queue-batch")
async def queue_batch_certificates(donation_ids: list[UUID], user: User):
    task = generate_certificates_batch.delay(donation_ids, user.id)
    return {"batch_id": task.id, "status": "queued"}

@celery.task
def generate_certificates_batch(donation_ids, user_id):
    for donation_id in donation_ids:
        cert_service.generate_and_store(donation_id)
    notify_user(user_id, "Certificates ready")
```

#### Alternative 2: Lambda@Edge + CloudFront CDN with Certificate Pre-warming
**Use Case**: Global distribution, social preview optimization

- Deploy SVG generation as AWS Lambda@Edge function
- Cache certificates at CloudFront edge locations
- Pre-warm certificates for popular donors (top 100)
- Instant social preview rendering via CloudFront CDN

**Benefit**: Sub-100ms SVG delivery globally, eliminates S3 origin latency

#### Alternative 3: Soroban Smart Contract Integration
**Use Case**: Immutable certificate registry on Soroban contract

- Store certificate hash on Soroban (contract state)
- Reference onchain hash in S3 metadata
- Certificate becomes part of blockchain audit trail
- Enable IPFS pinning for decentralized storage

**Implementation:**
```python
async def register_certificate_onchain(svg_hash, tx_hash):
    soroban_client.invoke_contract(
        contract_id="certificate_registry",
        method="register_certificate",
        params=[svg_hash, tx_hash, datetime.now().timestamp()]
    )
```

---

## Security Considerations

1. **SVG Injection**: Sanitize donor/beneficiary names (no XML/script injection)
   - Use `xml.etree.ElementTree.escape()` for user inputs

2. **S3 Access Control**: Public read-only, authenticated write-only
   - IAM role with s3:PutObject only from FastAPI service

3. **Certificate Tampering**: 
   - Verify SVG hash against DB before rendering
   - Include tx_hash in certificate for immutability proof

4. **Rate Limiting**: Cap certificate generation to 100/hour per user (prevent abuse)

---

## Monitoring & Observability

**Key Metrics:**
- S3 upload latency (target: <500ms)
- Stellar verification success rate (target: >99%)
- Certificate generation time (target: <3s end-to-end)
- Public S3 cache hit ratio (target: >80% for repeated certificates)

**Alerts:**
- S3 upload failures >1% in 5min window
- Stellar network timeouts >2s
- Certificate integrity hash mismatches (indicates tampering attempt)

---

## Example Usage Flow

```bash
# 1. User donates on Stellar (tx: "abc123def456...")

# 2. Frontend calls certificate generation endpoint
curl -X POST https://api.lingap.com/api/v1/certificates/generate-onchain \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stellar_tx_hash": "abc123def456",
    "donation_id": "550e8400-e29b-41d4-a716-446655440000",
    "merkle_proof": null,
    "onchain_hash": null
  }'

# 3. Response includes public URLs
# {
#   "certificate_id": "550e8400-e29b-41d4-a716-446655440001",
#   "svg_s3_url": "https://lingap-certificates-prod.s3.us-east-1.amazonaws.com/certificates/.../certificate.svg",
#   "html_s3_url": "https://lingap-certificates-prod.s3.us-east-1.amazonaws.com/certificates/.../certificate.html",
#   ...
# }

# 4. User shares certificate URL on social media
# OpenGraph meta tags auto-generate preview from embedded PNG fallback

# 5. Anyone can verify:
# - SVG integrity via svg_hash
# - Stellar transaction via Horizon API (tx_hash in certificate)
# - Certificate registry lookup (onchain_hash on Soroban)
```
