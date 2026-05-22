from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.balance_transaction import (
    BalancePaymentMethod,
    BalancePaymentStatus,
    BalanceTransaction,
    BalanceTransactionKind,
)
from app.models.user import User
from app.models.donation import Donation
from app.models.provenance import ProvenanceRecord
from app.schemas.donation import DonationCreate
from app.stellar.client import verify_transaction
from app.stellar.ledger_service import record_donation
from app.certificates.service import create_certificate_for_donation
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/donations", tags=["donations"])


def _php(amount_xlm: float) -> float:
    return round(amount_xlm * settings.XLM_TO_PHP_RATE, 2)


def _demo_donation_hash() -> str:
    return f"LINGAP-DEMO-DON-{uuid.uuid4().hex[:28]}"


def _read(d: Donation, donor_name: str, balance_tx: BalanceTransaction | None = None) -> dict:
    return {
        "id": d.id,
        "donor_id": d.donor_id,
        "donor_name": donor_name,
        "amount": float(d.amount),
        "asset": d.asset,
        "purpose": d.purpose,
        "stellar_tx_hash": d.stellar_tx_hash,
        "blockchain_confirmed": d.blockchain_confirmed,
        "disbursed": d.disbursed,
        "disbursed_amount": float(d.disbursed_amount or 0),
        "funding_source": balance_tx.payment_method.value if balance_tx else None,
        "amount_php": float(balance_tx.amount_php) if balance_tx else _php(float(d.amount)),
        "created_at": d.created_at,
    }


async def _balance_for_user(db: AsyncSession, user_id: uuid.UUID) -> float:
    rows = (
        await db.execute(
            select(BalanceTransaction).where(
                BalanceTransaction.user_id == user_id,
                BalanceTransaction.payment_status == BalancePaymentStatus.confirmed,
            )
        )
    ).scalars().all()

    balance = 0.0
    for tx in rows:
        amount = float(tx.amount_xlm)
        if tx.kind == BalanceTransactionKind.top_up:
            balance += amount
        elif tx.kind == BalanceTransactionKind.donation:
            balance -= amount
    return round(max(balance, 0.0), 7)


async def _balance_tx_for_donation(db: AsyncSession, donation_id: uuid.UUID) -> BalanceTransaction | None:
    return (
        await db.execute(
            select(BalanceTransaction).where(BalanceTransaction.donation_id == donation_id)
        )
    ).scalar_one_or_none()


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
        balance_tx = await _balance_tx_for_donation(db, d.id)
        items.append(_read(d, user.name if user else "Unknown", balance_tx))

    return {"items": items, "total": total, "page": page, "size": size, "pages": -(-total // size)}


@router.get("/me")
async def my_donations(
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    offset = (page - 1) * size
    query = (
        select(Donation)
        .where(Donation.donor_id == user.id)
        .order_by(Donation.created_at.desc())
    )
    donations = (await db.execute(query.offset(offset).limit(size))).scalars().all()
    total = (
        await db.execute(
            select(func.count()).select_from(Donation).where(Donation.donor_id == user.id)
        )
    ).scalar()

    return {
        "items": [
            _read(d, user.name, await _balance_tx_for_donation(db, d.id))
            for d in donations
        ],
        "total": total,
        "page": page,
        "size": size,
        "pages": -(-total // size),
    }


@router.post("", status_code=201)
async def create_donation(
    body: DonationCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if body.amount <= 0:
        raise HTTPException(status_code=422, detail="Donation amount must be greater than 0.")

    existing = (
        await db.execute(
            select(Donation).where(
                Donation.donor_id == user.id,
                Donation.stellar_tx_hash == body.stellar_tx_hash,
            )
        )
    ).scalar_one_or_none() if body.stellar_tx_hash else None
    if existing:
        balance_tx = await _balance_tx_for_donation(db, existing.id)
        return {
            "success": True,
            "message": "Donation already recorded",
            "data": _read(existing, user.name, balance_tx),
        }

    balance_tx: BalanceTransaction | None = None
    tx_hash = body.stellar_tx_hash or _demo_donation_hash()
    blockchain_confirmed = False

    if body.spend_balance:
        balance = await _balance_for_user(db, user.id)
        if balance < body.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You do not have enough XLM balance to complete this donation. Please top up first.",
            )
        blockchain_confirmed = True

    donation = Donation(
        donor_id=user.id,
        amount=body.amount,
        asset=body.asset,
        purpose=body.purpose,
        stellar_tx_hash=tx_hash,
        blockchain_confirmed=blockchain_confirmed,
    )
    db.add(donation)
    await db.commit()
    await db.refresh(donation)

    if body.spend_balance:
        campaign_id = body.purpose.replace("campaign:", "", 1) if body.purpose and body.purpose.startswith("campaign:") else None
        balance_tx = BalanceTransaction(
            user_id=user.id,
            kind=BalanceTransactionKind.donation,
            amount_xlm=body.amount,
            amount_php=_php(body.amount),
            payment_method=BalancePaymentMethod.lingap_balance,
            payment_reference=tx_hash,
            payment_status=BalancePaymentStatus.confirmed,
            campaign_id=campaign_id,
            donation_id=donation.id,
            stellar_tx_hash=tx_hash,
            note=f"Donation locked to campaign vault from LINGAP balance. Wallet: {body.wallet_address or 'not provided'}",
        )
        db.add(balance_tx)
        await db.commit()
        await db.refresh(balance_tx)
        await record_donation(balance_tx)

    if not body.spend_balance and body.stellar_tx_hash:
        # Async verify tx on Stellar
        try:
            tx_info = await verify_transaction(body.stellar_tx_hash)
            donation.blockchain_confirmed = tx_info.get("confirmed", False)
            await db.commit()
        except Exception:
            pass

    # Trigger certificate generation if confirmed.
    if donation.blockchain_confirmed:
        try:
            await create_certificate_for_donation(donation, db)
        except Exception as e:
            logger.error(
                f"Certificate generation failed for donation {donation.id}: {e}"
            )

    return {"success": True, "message": "Donation recorded", "data": _read(donation, user.name, balance_tx)}


@router.get("/{donation_id}")
async def get_donation(donation_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    d = (await db.execute(select(Donation).where(Donation.id == donation_id))).scalar_one_or_none()
    if not d:
        raise HTTPException(404, "Donation not found")
    user = (await db.execute(select(User).where(User.id == d.donor_id))).scalar_one_or_none()
    balance_tx = await _balance_tx_for_donation(db, d.id)
    return {"success": True, "message": "ok", "data": _read(d, user.name if user else "Unknown", balance_tx)}


@router.get("/{donation_id}/provenance")
async def get_provenance(donation_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    records = (
        await db.execute(
            select(ProvenanceRecord).where(ProvenanceRecord.donation_id == donation_id)
        )
    ).scalars().all()
    return {"success": True, "message": "ok", "data": [r.__dict__ for r in records]}
