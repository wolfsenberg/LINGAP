from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.donation import Donation
from app.models.provenance import ProvenanceRecord
from app.schemas.donation import DonationCreate, DonationRead
from app.stellar.client import verify_transaction
from app.certificates.service import create_certificate_for_donation
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/donations", tags=["donations"])


def _read(d: Donation, donor_name: str) -> dict:
    return {
        **DonationRead.model_validate(d).model_dump(),
        "donor_name": donor_name,
    }


@router.get("")
async def list_donations(
    page: int = 1, size: int = 20, db: AsyncSession = Depends(get_db)
):
    offset = (page - 1) * size
    result = await db.execute(select(Donation).order_by(Donation.created_at.desc()).offset(offset).limit(size))
    donations = result.scalars().all()
    total = (await db.execute(select(func.count()).select_from(Donation))).scalar()

    items = []
    for d in donations:
        user = (await db.execute(select(User).where(User.id == d.donor_id))).scalar_one_or_none()
        items.append(_read(d, user.name if user else "Unknown"))

    return {"items": items, "total": total, "page": page, "size": size, "pages": -(-total // size)}


@router.post("", status_code=201)
async def create_donation(
    body: DonationCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    donation = Donation(
        donor_id=user.id,
        amount=body.amount,
        asset=body.asset,
        purpose=body.purpose,
        stellar_tx_hash=body.stellar_tx_hash,
    )
    db.add(donation)
    await db.commit()
    await db.refresh(donation)

    # Async verify tx on Stellar
    try:
        tx_info = await verify_transaction(body.stellar_tx_hash)
        donation.blockchain_confirmed = tx_info.get("confirmed", False)
        await db.commit()

        # NEW: Trigger certificate generation if confirmed
        if donation.blockchain_confirmed:
            try:
                await create_certificate_for_donation(donation, db)
            except Exception as e:
                logger.error(
                    f"Certificate generation failed for donation {donation.id}: {e}"
                )
    except Exception:
        pass

    return {"success": True, "message": "Donation recorded", "data": _read(donation, user.name)}


@router.get("/{donation_id}")
async def get_donation(donation_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    d = (await db.execute(select(Donation).where(Donation.id == donation_id))).scalar_one_or_none()
    if not d:
        raise HTTPException(404, "Donation not found")
    user = (await db.execute(select(User).where(User.id == d.donor_id))).scalar_one_or_none()
    return {"success": True, "message": "ok", "data": _read(d, user.name if user else "Unknown")}


@router.get("/{donation_id}/provenance")
async def get_provenance(donation_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    records = (
        await db.execute(
            select(ProvenanceRecord).where(ProvenanceRecord.donation_id == donation_id)
        )
    ).scalars().all()
    return {"success": True, "message": "ok", "data": [r.__dict__ for r in records]}
