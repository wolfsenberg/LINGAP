from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.aid_request import AidRequest, AidRequestStatus
from app.models.beneficiary import Beneficiary
from app.models.provenance import ProvenanceRecord
from app.schemas.aid_request import AidRequestCreate, AidRequestRead, RejectRequest
from app.stellar.client import send_payment
from app.config import settings
import uuid

router = APIRouter(prefix="/aid-requests", tags=["aid-requests"])


def _enrich(req: AidRequest, beneficiary_name: str) -> dict:
    d = AidRequestRead.model_validate(req).model_dump()
    d["beneficiary_name"] = beneficiary_name
    return d


@router.get("")
async def list_aid_requests(
    page: int = 1,
    size: int = 20,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * size
    q = select(AidRequest).order_by(AidRequest.created_at.desc())
    if status:
        q = q.where(AidRequest.status == AidRequestStatus(status))
    items = (await db.execute(q.offset(offset).limit(size))).scalars().all()
    total = (await db.execute(select(func.count()).select_from(AidRequest))).scalar()

    enriched = []
    for r in items:
        b = (await db.execute(select(Beneficiary).where(Beneficiary.id == r.beneficiary_id))).scalar_one_or_none()
        enriched.append(_enrich(r, b.name if b else "Unknown"))

    return {"items": enriched, "total": total, "page": page, "size": size, "pages": -(-total // size)}


@router.post("", status_code=201)
async def create_aid_request(
    body: AidRequestCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    b = (await db.execute(select(Beneficiary).where(Beneficiary.id == body.beneficiary_id))).scalar_one_or_none()
    if not b:
        raise HTTPException(404, "Beneficiary not found")
    if not b.verified:
        raise HTTPException(400, "Beneficiary is not yet verified")

    req = AidRequest(**body.model_dump())
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return {"success": True, "message": "Aid request created", "data": _enrich(req, b.name)}


@router.patch("/{request_id}/approve")
async def approve_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    req = (await db.execute(select(AidRequest).where(AidRequest.id == request_id))).scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Request not found")
    if req.status != AidRequestStatus.pending:
        raise HTTPException(400, "Only pending requests can be approved")

    req.status = AidRequestStatus.approved
    req.approved_by = admin.id
    await db.commit()
    await db.refresh(req)
    b = (await db.execute(select(Beneficiary).where(Beneficiary.id == req.beneficiary_id))).scalar_one()
    return {"success": True, "message": "Request approved", "data": _enrich(req, b.name)}


@router.patch("/{request_id}/disburse")
async def disburse_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    req = (await db.execute(select(AidRequest).where(AidRequest.id == request_id))).scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Request not found")
    if req.status != AidRequestStatus.approved:
        raise HTTPException(400, "Only approved requests can be disbursed")

    b = (await db.execute(select(Beneficiary).where(Beneficiary.id == req.beneficiary_id))).scalar_one()
    if not b.stellar_public_key:
        raise HTTPException(400, "Beneficiary has no Stellar public key")

    tx_hash = await send_payment(
        destination=b.stellar_public_key,
        amount=str(req.requested_amount),
        asset_code=req.asset,
        memo=f"LINGAP-{str(req.id)[:8]}",
    )

    req.status = AidRequestStatus.disbursed
    req.stellar_tx_hash = tx_hash
    b.total_received = float(b.total_received) + req.requested_amount

    prov = ProvenanceRecord(
        donation_id=uuid.uuid4(),  # in production: link to actual donation
        aid_request_id=req.id,
        beneficiary_id=b.id,
        amount=req.requested_amount,
        asset=req.asset,
        contract_address=settings.CONTRACT_AID_PROVENANCE,
        stellar_tx_hash=tx_hash,
        ledger=0,
    )
    db.add(prov)
    await db.commit()
    await db.refresh(req)
    return {"success": True, "message": "Aid disbursed on-chain", "data": _enrich(req, b.name)}


@router.patch("/{request_id}/reject")
async def reject_request(
    request_id: uuid.UUID,
    body: RejectRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    req = (await db.execute(select(AidRequest).where(AidRequest.id == request_id))).scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Request not found")
    req.status = AidRequestStatus.rejected
    req.rejection_reason = body.reason
    await db.commit()
    await db.refresh(req)
    b = (await db.execute(select(Beneficiary).where(Beneficiary.id == req.beneficiary_id))).scalar_one()
    return {"success": True, "message": "Request rejected", "data": _enrich(req, b.name)}
