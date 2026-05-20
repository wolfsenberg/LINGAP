# Architectural Alternatives for Certificate Generation & Storage

## Current Architecture (Synchronous)

```
POST /api/v1/certificates/generate-onchain
  ↓
[1-2s] Verify Stellar tx via Horizon API
  ↓
[~10ms] Generate SVG in-memory
  ↓
[200-500ms] Upload SVG to S3
  ↓
[200-500ms] Upload HTML wrapper to S3
  ↓
[~5ms] Save metadata to DB
  ↓
RESPONSE (3-4s total) ← User waits
```

**Pros:**
- Simple, direct flow
- No external dependencies (Celery, Redis)
- Immediate user feedback with all URLs

**Cons:**
- High latency (~3-4s blocking request)
- Stellar network timeout = entire request fails
- Scales poorly under high load (50+ concurrent users)
- Cannot retry failed uploads

---

## Alternative 1: Async Job Queue (Celery + Redis)

**Best for:** High-volume campaigns, batch processing, resilience

```
POST /api/v1/certificates/queue
  ↓
[~50ms] Create Job record in DB + Queue in Redis
  ↓
IMMEDIATE RESPONSE: { job_id, status: "queued" }
  ↓
                    ┌─── Background Worker 1
                    ├─── Background Worker 2  → [Generate + Upload]
                    └─── Background Worker N

User polls: GET /api/v1/certificates/jobs/{job_id}/status
  ↓
Response: { status: "completed", certificate_id, urls }
  ↓
Webhook (optional): POST {webhook_url}/certificate-ready
```

### Implementation

**requirements.txt:**
```
celery==5.4.0
redis==5.0.0
```

**config.py:**
```python
from celery import Celery

celery_app = Celery(
    "lingap",
    broker=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0",
    backend=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/1",
)

celery_app.conf.task_serializer = "json"
celery_app.conf.accept_content = ["json"]
```

**tasks.py:**
```python
@celery_app.task(bind=True, max_retries=3)
def generate_certificate_async(self, donation_id: str, user_id: str):
    try:
        service = OnChainCertificateService()
        cert_data = await service.generate_and_store_certificate(...)
        # Send webhook on success
        notify_webhook("certificate.ready", cert_data)
        return cert_data
    except Exception as exc:
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
```

**endpoint.py:**
```python
@router.post("/certificates/queue")
async def queue_certificate_generation(
    request: GenerateOnChainCertificateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Create job record
    job = CertificateGenerationJob(
        id=str(uuid.uuid4()),
        donation_id=request.donation_id,
        user_id=user.id,
        status="queued",
    )
    db.add(job)
    await db.commit()

    # Queue async task
    task = generate_certificate_async.delay(
        str(request.donation_id),
        str(user.id),
    )

    return {
        "job_id": job.id,
        "status": "queued",
        "poll_url": f"/api/v1/certificates/jobs/{job.id}/status",
    }
```

**Performance:**
- Response time: ~50ms (user gets immediate feedback)
- Processing time: 3-4s (happens in background)
- Concurrent capacity: 100+ simultaneous requests
- Failure recovery: Auto-retry with backoff

**Scalability:**
- Add more workers: `celery -A tasks worker --concurrency=10`
- Monitor queue depth: `redis-cli LLEN celery`
- Parallel processing: 10 certificates simultaneously

---

## Alternative 2: Lambda@Edge + CloudFront CDN

**Best for:** Global distribution, high caching, sub-100ms delivery

```
POST /api/v1/certificates/generate-onchain
  ↓
[1-2s] Verify Stellar tx
  ↓
[~100ms] Store metadata in DynamoDB (fast)
  ↓
RESPONSE: { certificate_id, cdn_url }
  ↓
CloudFront Edge Location (closest to user)
  ↓
Lambda@Edge function invoked on first request
  ↓
[~50ms] Generate SVG on-demand
  ↓
[2 weeks] Cache at edge location
  ↓
Subsequent requests: <10ms from edge cache
```

### Implementation

**Deploy Lambda function:**
```python
# lambda_function.py
import json
import hashlib
from datetime import datetime

def lambda_handler(event, context):
    # event["Records"][0]["cf"]["request"]["uri"] = "/certificates/{cert_id}/certificate.svg"
    
    cert_id = event["Records"][0]["cf"]["request"]["uri"].split("/")[2]
    
    # Fetch certificate metadata from DynamoDB
    cert_metadata = dynamodb.get_item(
        TableName="certificates",
        Key={"cert_id": {"S": cert_id}}
    )
    
    # Generate SVG on-demand
    svg = generate_svg_certificate(**cert_metadata["Item"])
    
    # Return response with cache headers
    return {
        "status": "200",
        "statusDescription": "OK",
        "headers": {
            "content-type": [{"key": "Content-Type", "value": "image/svg+xml"}],
            "cache-control": [
                {"key": "Cache-Control", "value": "public, max-age=1209600"}
            ],
        },
        "body": svg,
    }
```

**CloudFront distribution:**
```json
{
  "Origins": [
    {
      "DomainName": "lingap-api.com",
      "OriginPath": "/api/v1/certificates",
      "S3OriginConfig": {}
    }
  ],
  "CacheBehaviors": [
    {
      "PathPattern": "/certificates/*.svg",
      "ViewerProtocolPolicy": "https-only",
      "LambdaFunctionAssociations": [
        {
          "EventType": "origin-response",
          "LambdaFunctionARN": "arn:aws:lambda:.../certificate-generator:1"
        }
      ],
      "ForwardedValues": { "QueryString": false }
    }
  ]
}
```

**Performance:**
- First request: ~1.5s (Stellar verification + Lambda)
- Subsequent requests: <50ms (from CloudFront edge cache)
- Global users experience sub-100ms latency
- Bandwidth savings: ~70% (CloudFront compression + caching)

**Cost:**
- Lambda: $0.20 per 1M requests
- CloudFront: $0.085 per GB delivered
- 10M certificates = ~$2K/month

---

## Alternative 3: Soroban Smart Contract Integration

**Best for:** Immutable on-chain registry, decentralized verification

```
Certificate Storage Chain:
┌─────────────────────────────────────────┐
│ Soroban Contract: CertificateRegistry    │
├─────────────────────────────────────────┤
│ register_certificate(                    │
│   donor: Address,                        │
│   certificate_hash: Hash,                │
│   svg_s3_url: String,                    │
│   stellar_tx: Hash                       │
│ )                                        │
└─────────────────────────────────────────┘
        ↓
   Stellar State Ledger (immutable)
        ↓
   Public Verification Query:
   GET https://horizon.stellar.org/
     ?contract=certificate_registry
     &method=get_certificate
     &hash={certificate_hash}
```

### Implementation

**Soroban Smart Contract (Rust):**
```rust
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol, String, Bytes};

#[contract]
pub struct CertificateRegistry;

#[contractimpl]
impl CertificateRegistry {
    pub fn register_certificate(
        env: Env,
        donor: Address,
        certificate_hash: Bytes,
        svg_s3_url: String,
        stellar_tx: Bytes,
        timestamp: u64,
    ) {
        let key = Symbol::new(&env, "cert");
        
        env.storage().persistent().set(
            &key,
            &(
                donor,
                certificate_hash,
                svg_s3_url,
                stellar_tx,
                timestamp,
            ),
        );
    }

    pub fn get_certificate(env: Env, hash: Bytes) -> Option<(Address, String, Bytes, u64)> {
        let key = Symbol::new(&env, "cert");
        env.storage().persistent().get(&key)
    }
}
```

**FastAPI Integration:**
```python
from stellar_sdk import Keypair, Contract, Builder, Network, Server

async def register_certificate_onchain(
    svg_hash: str,
    s3_url: str,
    tx_hash: str,
):
    """Register certificate hash on Soroban contract."""
    
    keypair = Keypair.from_secret(settings.STELLAR_SOURCE_SECRET_KEY)
    server = Server("https://soroban-testnet.stellar.org")
    
    account = server.load_account(keypair.public_key)
    
    # Invoke Soroban contract function
    tx_builder = Builder(
        keypair=keypair,
        base_fee=10000,
        network_passphrase=Network.TESTNET_NETWORK_PASSPHRASE,
    )
    
    contract = Contract(
        contract_id=settings.SOROBAN_CERTIFICATE_REGISTRY,
    )
    
    tx_builder.append_invoke_host_function_op(
        contract.invoke(
            "register_certificate",
            [
                keypair,  # donor
                bytes.fromhex(svg_hash),  # certificate_hash
                s3_url,  # svg_s3_url
                bytes.fromhex(tx_hash),  # stellar_tx
                int(datetime.now().timestamp()),  # timestamp
            ],
        )
    )
    
    tx = tx_builder.build()
    tx.sign(keypair)
    
    response = server.submit_transaction(tx)
    return response["hash"]
```

**Verification:**
```python
async def verify_certificate_onchain(certificate_hash: str) -> dict:
    """Query Soroban contract for certificate verification."""
    
    soroban_client = ...
    
    cert_data = soroban_client.invoke(
        contract_id=settings.SOROBAN_CERTIFICATE_REGISTRY,
        method="get_certificate",
        params=[bytes.fromhex(certificate_hash)],
    )
    
    return {
        "donor": cert_data[0],
        "s3_url": cert_data[1],
        "stellar_tx": cert_data[2].hex(),
        "timestamp": cert_data[3],
        "verified_onchain": True,
    }
```

**Benefits:**
- Certificate becomes part of immutable blockchain ledger
- No reliance on centralized database
- Public verifiability without API server
- Enables IPFS pinning for full decentralization

**Cost:**
- Soroban invocation: ~100-500 stroops (~$0.000001-0.000005)
- Per 100K certificates: <$0.50

---

## Comparison Matrix

| Aspect | Current | Async Queue | Lambda@Edge | Soroban |
|--------|---------|-------------|------------|---------|
| **Response Time** | 3-4s | 50ms | 50ms | 1.5-2s |
| **Scalability** | Low (10-20 RPS) | High (100+ RPS) | Very High (1000+ RPS) | Medium (50 RPS) |
| **Complexity** | Low | Medium | Medium-High | High |
| **Cost/1M certs** | ~$10 | ~$15 | ~$2,000 | <$1 |
| **Geo-Distribution** | Poor | Fair | Excellent | Fair |
| **Decentralization** | None | None | None | Full |
| **Failure Recovery** | Manual | Automatic | Automatic | Manual |
| **User Experience** | Blocking wait | Polling/Webhook | Instant | Slower but verified |

---

## Recommendation Matrix

**Choose Current (Sync) if:**
- Expected < 20 concurrent requests/second
- Willing to accept 3-4s latency
- Simple deployment preferred
- Cost is secondary concern

**Choose Async Queue (Alternative 1) if:**
- Expected 50-200 concurrent requests/second
- Can accept 50-100ms response + async processing
- Want automatic failure recovery
- Need background job monitoring

**Choose Lambda@Edge (Alternative 2) if:**
- Expected 500+ concurrent requests/second
- Global users requiring <100ms latency
- Heavy caching for repeated certificate access
- CloudFront infrastructure already in use

**Choose Soroban (Alternative 3) if:**
- Want immutable, decentralized certificate registry
- Users require trustless verification
- Plan to sunset centralized API
- Long-term strategy is Web3 integration

---

## Hybrid Approach (Recommended for Growth)

```
Phase 1 (Current):
  - Implement Current Architecture
  - Monitor metrics (latency, success rate)

Phase 2 (50 concurrent users):
  - Switch to Async Queue + Polling
  - Keep Current for fallback

Phase 3 (500+ concurrent users):
  - Add Lambda@Edge + CloudFront
  - Cache pre-generated certificates

Phase 4 (Decentralization):
  - Integrate Soroban for permanent registry
  - Enable IPFS pinning
  - Transition to trustless verification
```

**Migration Path:**
```
Step 1: Async queue handles generation
Step 2: CloudFront caches completed certificates
Step 3: Soroban contract stores certificate hashes
Step 4: IPFS stores SVG copies (backup + decentralized access)
```

This allows incremental upgrades without rewriting core logic.
