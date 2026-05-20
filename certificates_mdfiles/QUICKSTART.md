# Quick Start - Deploy On-Chain Certificates in 15 Minutes

## Prerequisites
- Python 3.9+ with FastAPI/SQLAlchemy
- PostgreSQL with async support
- AWS account with S3 access
- Git + alembic for migrations

---

## 1. Add Code Files (3 min)

Copy these files to your backend:

```bash
# From deliverables:
cp backend/app/certificates/svg_generator.py backend/app/certificates/
cp backend/app/certificates/onchain_service.py backend/app/certificates/
cp backend/app/storage/svg_s3.py backend/app/storage/
cp backend/app/api/v1/onchain_certificates.py backend/app/api/v1/
```

---

## 2. Update Existing Files (2 min)

**backend/app/models/donation_certificate.py:**
Already updated in deliverables. Replace entire file.

**backend/app/api/v1/router.py:**
Already updated in deliverables. Replace entire file.

---

## 3. Database Migration (3 min)

```bash
cd backend

# Generate migration
alembic revision --autogenerate -m "Add on-chain certificate fields"

# Apply migration
alembic upgrade head

# Verify
psql -U lingap -d lingap -c "SELECT column_name FROM information_schema.columns WHERE table_name='donation_certificates' AND column_name='svg_s3_url';"
# Should return: svg_s3_url
```

---

## 4. Configure Environment (2 min)

**Add to backend/.env:**

```env
AWS_ACCESS_KEY_ID=your_iam_access_key
AWS_SECRET_ACCESS_KEY=your_iam_secret_key
AWS_S3_BUCKET=lingap-certificates-prod
AWS_REGION=us-east-1
```

---

## 5. Setup S3 Bucket (3 min)

**Run these AWS CLI commands:**

```bash
# 1. Create bucket
aws s3api create-bucket --bucket lingap-certificates-prod --region us-east-1

# 2. Disable block public access
aws s3api put-public-access-block \
  --bucket lingap-certificates-prod \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# 3. Apply public read policy
cat > /tmp/policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::lingap-certificates-prod/certificates/*"
  }]
}
EOF

aws s3api put-bucket-policy --bucket lingap-certificates-prod --policy file:///tmp/policy.json

# 4. Enable CORS
cat > /tmp/cors.json << 'EOF'
{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"]
  }]
}
EOF

aws s3api put-bucket-cors --bucket lingap-certificates-prod --cors-configuration file:///tmp/cors.json
```

**Verify:**
```bash
curl https://lingap-certificates-prod.s3.us-east-1.amazonaws.com/certificates/test/test.svg
# Should return 403 (no file yet, but proves public access works)
```

---

## 6. Test Endpoint (2 min)

**Start FastAPI server:**
```bash
cd backend
python -m uvicorn app.main:app --reload
```

**In another terminal:**
```bash
# Get a JWT token (adjust for your auth system)
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.access_token')

# Test endpoint
curl -X POST http://localhost:8000/api/v1/certificates/generate-onchain \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stellar_tx_hash": "4eae3d4b6f83a7f0c8f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    "donation_id": "550e8400-e29b-41d4-a716-446655440000"
  }'

# Response should include:
# {
#   "certificate_id": "...",
#   "svg_s3_url": "https://lingap-certificates-prod.s3.us-east-1.amazonaws.com/...",
#   ...
# }
```

---

## 7. Done! 

Your on-chain certificate system is now live.

**Next steps:**
1. Test with a real Stellar transaction
2. Share certificate URL on social media (should show preview)
3. Monitor CloudWatch for S3 upload latency
4. Consider Alternative 1 (Async Queue) if load exceeds 20 RPS

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: app.certificates.onchain_service` | Verify files copied to correct directories |
| `S3UploadFailure` | Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY |
| `Stellar transaction not confirmed` | Verify tx_hash is valid (64 hex chars) |
| `Certificate already exists` | This is correct (unique constraint). Try different donation_id |
| `403 Forbidden on curl` | S3 bucket policy not applied correctly. Rerun Step 5 |

---

## File Locations (Verify)

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── onchain_certificates.py      ✓ NEW
│   │   └── router.py                    ✓ UPDATED
│   ├── certificates/
│   │   ├── svg_generator.py             ✓ NEW
│   │   └── onchain_service.py           ✓ NEW
│   ├── storage/
│   │   └── svg_s3.py                    ✓ NEW
│   └── models/
│       └── donation_certificate.py      ✓ UPDATED
```

---

## Documentation Files

For detailed information, read:
- `ONCHAIN_CERTIFICATE_SYSTEM.md` - Full architecture
- `API_REFERENCE.md` - Complete API docs
- `S3_BUCKET_SETUP.md` - AWS detailed setup
- `INTEGRATION_GUIDE.md` - Comprehensive guide
- `ARCHITECTURAL_ALTERNATIVES.md` - Scaling options
- `IMPLEMENTATION_SUMMARY.md` - Full summary

---

## Performance

- **Response Time:** 3-4 seconds (Stellar verification bottleneck)
- **Scalability:** ~10-20 concurrent users
- **Cost:** ~$0.01 per certificate (S3 storage + API calls)

For higher scale, see `ARCHITECTURAL_ALTERNATIVES.md` (Alternative 1: Async Queue)
