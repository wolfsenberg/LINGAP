from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.beneficiary import Beneficiary
from app.schemas.beneficiary import BeneficiaryCreate, BeneficiaryRead
import uuid

router = APIRouter(prefix="/beneficiaries", tags=["beneficiaries"])


@router.get("")
async def list_beneficiaries(page: int = 1, size: int = 20, db: AsyncSession = Depends(get_db)):
    offset = (page - 1) * size
    result = await db.execute(
        select(Beneficiary).order_by(Beneficiary.created_at.desc()).offset(offset).limit(size)
    )
    items = result.scalars().all()
    total = (await db.execute(select(func.count()).select_from(Beneficiary))).scalar()
    return {
        "items": [BeneficiaryRead.model_validate(b).model_dump() for b in items],
        "total": total,
        "page": page,
        "size": size,
        "pages": -(-total // size),
    }


@router.post("", status_code=201)
async def create_beneficiary(
    body: BeneficiaryCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    b = Beneficiary(**body.model_dump())
    db.add(b)
    await db.commit()
    await db.refresh(b)
    return {"success": True, "message": "Beneficiary created", "data": BeneficiaryRead.model_validate(b)}


@router.get("/{beneficiary_id}")
async def get_beneficiary(beneficiary_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    b = (await db.execute(select(Beneficiary).where(Beneficiary.id == beneficiary_id))).scalar_one_or_none()
    if not b:
        raise HTTPException(404, "Beneficiary not found")
    return {"success": True, "message": "ok", "data": BeneficiaryRead.model_validate(b)}


@router.patch("/{beneficiary_id}/verify")
async def verify_beneficiary(
    beneficiary_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    b = (await db.execute(select(Beneficiary).where(Beneficiary.id == beneficiary_id))).scalar_one_or_none()
    if not b:
        raise HTTPException(404, "Beneficiary not found")
    b.verified = True
    await db.commit()
    await db.refresh(b)
    return {"success": True, "message": "Beneficiary verified", "data": BeneficiaryRead.model_validate(b)}
