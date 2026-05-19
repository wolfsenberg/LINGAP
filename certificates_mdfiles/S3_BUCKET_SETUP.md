# AWS S3 Public Bucket Setup for Donation Certificates

**Objective**: Configure a public S3 bucket for storing and serving SVG/HTML donation certificates with public read access.

---

## 3-Step Checklist

### ✓ Step 1: Create S3 Bucket & Configure Public Access

**Command:**
```bash
aws s3api create-bucket \
  --bucket lingap-certificates-prod \
  --region us-east-1
```

**Disable Block Public Access:**
```bash
aws s3api put-public-access-block \
  --bucket lingap-certificates-prod \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

**Verify:**
```bash
aws s3api get-public-access-block --bucket lingap-certificates-prod
```

**Output should show all BlockXxx settings as `false`**

---

### ✓ Step 2: Apply Bucket Policy for Public Read

**Create file:** `bucket-policy.json`

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

**Verify:**
```bash
aws s3api get-bucket-policy --bucket lingap-certificates-prod
```

**Test Public Access:**
```bash
# Upload a test file
aws s3 cp test.svg s3://lingap-certificates-prod/certificates/test/test.svg

# Access via public URL
curl https://lingap-certificates-prod.s3.us-east-1.amazonaws.com/certificates/test/test.svg
# Should return the SVG content (not 403 Forbidden)
```

---

### ✓ Step 3: Enable CORS for Web Embedding

**Create file:** `cors-config.json`

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://yourdomain.com",
        "https://app.yourdomain.com",
        "https://*.yourdomain.com"
      ],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "x-amz-meta-*"],
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
aws s3api get-bucket-cors --bucket lingap-certificates-prod
```

---

## Additional Recommended Configurations

### Versioning (Optional: for certificate rollback)

```bash
aws s3api put-bucket-versioning \
  --bucket lingap-certificates-prod \
  --versioning-configuration Status=Enabled
```

### Encryption (Required by policy above)

```bash
aws s3api put-bucket-encryption \
  --bucket lingap-certificates-prod \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }'
```

### Lifecycle Policy (Optional: auto-delete old certificates after 7 years)

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket lingap-certificates-prod \
  --lifecycle-configuration '{
    "Rules": [
      {
        "Id": "DeleteOldCertificates",
        "Status": "Enabled",
        "Prefix": "certificates/",
        "Expiration": {
          "Days": 2555
        }
      }
    ]
  }'
```

---

## Verification Checklist

| Item | Command | Expected Result |
|------|---------|-----------------|
| **Bucket Exists** | `aws s3 ls \| grep lingap-certificates-prod` | Bucket listed |
| **Public Access Disabled** | `aws s3api get-public-access-block --bucket lingap-certificates-prod` | All BlockXxx = false |
| **Bucket Policy Applied** | `aws s3api get-bucket-policy --bucket lingap-certificates-prod` | Includes PublicReadGetObject |
| **CORS Enabled** | `aws s3api get-bucket-cors --bucket lingap-certificates-prod` | Includes AllowedOrigins |
| **Public Read Works** | `curl https://lingap-certificates-prod.s3.us-east-1.amazonaws.com/certificates/test/test.svg` | Returns 200 (SVG content) |
| **Encryption Enabled** | `aws s3api get-bucket-encryption --bucket lingap-certificates-prod` | AES256 configured |

---

## FastAPI Environment Variables

**Add to `.env`:**

```env
# AWS S3 Configuration for Certificates
AWS_ACCESS_KEY_ID=your_iam_user_access_key
AWS_SECRET_ACCESS_KEY=your_iam_user_secret_key
AWS_S3_BUCKET=lingap-certificates-prod
AWS_REGION=us-east-1
```

**IAM User Permissions (Minimum):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::lingap-certificates-prod",
        "arn:aws:s3:::lingap-certificates-prod/certificates/*"
      ]
    }
  ]
}
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| **403 Forbidden on curl** | Public access blocked or policy missing | Check Step 2 policy and public access settings |
| **CORS error in browser** | CORS not configured or origin mismatch | Check Step 3 CORS config matches your domain |
| **SVG not rendering** | ContentType not set to `image/svg+xml` | Ensure boto3 `put_object` sets ContentType |
| **Presigned URLs failing** | IAM user lacks permissions | Update IAM user policy with PutObject + GetObject |

---

## Cost Estimation (Annual)

- **Storage**: 1GB of certificates → ~$0.023/month ($0.27/year)
- **Data Transfer Out**: 10M requests × 50KB/cert → ~$0.40/month ($4.80/year)
- **API Calls**: ~100k PutObject/GetObject calls → ~$0.50/month ($6/year)

**Total: ~$11/year for 10M public certificates**

---

## References

- [AWS S3 Public Bucket Documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-overview.html)
- [S3 Bucket Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html)
- [CORS Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)
