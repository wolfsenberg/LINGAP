from uuid import UUID
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

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
from app.schemas.balance import BalanceRead, BalanceTransactionRead, TopUpSimulateCreate
from app.stellar.client import verify_native_payment
from app.stellar.ledger_service import record_top_up

router = APIRouter(tags=["balance"])

SIMULATED_TOPUP_METHODS = {
    BalancePaymentMethod.pdax,
    BalancePaymentMethod.gcash,
    BalancePaymentMethod.maya,
}

METHOD_LABELS = {
    BalancePaymentMethod.pdax: "PDAX",
    BalancePaymentMethod.gcash: "GCash",
    BalancePaymentMethod.maya: "Maya",
    BalancePaymentMethod.stellar_wallet: "Stellar Wallet",
}


async def current_xlm_to_php_rate() -> tuple[float, str]:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={"ids": "stellar", "vs_currencies": "php"},
            )
            res.raise_for_status()
            rate = float(res.json()["stellar"]["php"])
            if rate > 0:
                return rate, "coingecko_live"
    except Exception:
        pass
    return settings.XLM_TO_PHP_RATE, "configured_rate"


def xlm_to_php(amount_xlm: float, rate: float) -> float:
    return round(amount_xlm * rate, 2)


def php_to_xlm(amount_php: float, rate: float) -> float:
    return round(amount_php / rate, 7)


def _method_from_string(value: str) -> BalancePaymentMethod:
    try:
        return BalancePaymentMethod(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="paymentMethod must be pdax, gcash, maya, or stellar_wallet.",
        ) from exc


def _read_transaction(tx: BalanceTransaction) -> BalanceTransactionRead:
    return BalanceTransactionRead(
        id=tx.id,
        kind=tx.kind.value,
        amount_xlm=float(tx.amount_xlm),
        amount_php=float(tx.amount_php),
        payment_method=tx.payment_method.value,
        payment_reference=tx.payment_reference,
        payment_status=tx.payment_status.value,
        campaign_id=tx.campaign_id,
        donation_id=tx.donation_id,
        stellar_tx_hash=tx.stellar_tx_hash,
        note=tx.note,
        created_at=tx.created_at,
    )


async def get_user_xlm_balance(db: AsyncSession, user_id: UUID) -> float:
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


async def get_recent_transactions(
    db: AsyncSession,
    user_id: UUID,
    limit: int = 20,
) -> list[BalanceTransaction]:
    return (
        await db.execute(
            select(BalanceTransaction)
            .where(BalanceTransaction.user_id == user_id)
            .order_by(BalanceTransaction.created_at.desc())
            .limit(min(max(limit, 1), 100))
        )
    ).scalars().all()


async def next_ledger_reference(db: AsyncSession, method: BalancePaymentMethod) -> str:
    count = (
        await db.execute(
            select(func.count()).select_from(BalanceTransaction).where(
                BalanceTransaction.payment_method == method,
                BalanceTransaction.kind == BalanceTransactionKind.top_up,
            )
        )
    ).scalar() or 0
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    return f"{method.value.upper()}-{stamp}-{int(count) + 1:04d}"


async def create_confirmed_top_up(
    db: AsyncSession,
    user: User,
    method: BalancePaymentMethod,
    amount_xlm: float,
    rate: float,
) -> BalanceTransaction:
    tx = BalanceTransaction(
        user_id=user.id,
        kind=BalanceTransactionKind.top_up,
        amount_xlm=amount_xlm,
        amount_php=xlm_to_php(amount_xlm, rate),
        payment_method=method,
        payment_reference=await next_ledger_reference(db, method),
        payment_status=BalancePaymentStatus.confirmed,
        note=f"{METHOD_LABELS.get(method, method.value)} payment confirmation credited to the LINGAP balance ledger.",
    )
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    await record_top_up(tx)
    return tx


@router.get("/rates/xlm-php")
async def get_xlm_php_rate():
    rate, source = await current_xlm_to_php_rate()
    return {
        "success": True,
        "message": "XLM/PHP conversion rate",
        "data": {
            "xlm_to_php_rate": rate,
            "source": source,
        },
    }


@router.get("/me/balance", response_model=dict)
async def get_my_balance(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rate, _ = await current_xlm_to_php_rate()
    balance = await get_user_xlm_balance(db, user.id)
    transactions = await get_recent_transactions(db, user.id, 10)
    payload = BalanceRead(
        xlm_balance=balance,
        php_equivalent=xlm_to_php(balance, rate),
        xlm_to_php_rate=rate,
        transactions=[_read_transaction(tx) for tx in transactions],
    )
    return {"success": True, "message": "ok", "data": payload.model_dump()}


@router.get("/me/transactions")
async def get_my_transactions(
    limit: int = 25,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    transactions = await get_recent_transactions(db, user.id, limit)
    return {
        "success": True,
        "message": "ok",
        "data": [_read_transaction(tx).model_dump() for tx in transactions],
    }


@router.post("/topups/simulate", status_code=201)
async def simulate_top_up(
    body: TopUpSimulateCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    method = _method_from_string(body.payment_method)
    if body.amount_xlm is None and body.amount_php is None:
        raise HTTPException(status_code=422, detail="Enter an amount in XLM or PHP.")

    rate, _ = await current_xlm_to_php_rate()
    amount_xlm = body.amount_xlm if body.amount_xlm is not None else php_to_xlm(float(body.amount_php or 0), rate)
    if amount_xlm <= 0:
        raise HTTPException(status_code=422, detail="Amount must be greater than 0.")

    amount_xlm = round(float(amount_xlm), 7)

    # All methods now require a real Stellar tx signed via Freighter.
    # Verify the payment landed on-chain before crediting the balance.
    if not settings.LINGAP_RECEIVER_PUBLIC_KEY:
        raise HTTPException(status_code=400, detail="LINGAP receiving wallet is not configured.")
    if not body.sender_wallet or not body.stellar_tx_hash:
        raise HTTPException(
            status_code=422,
            detail="A Stellar transaction hash and sender wallet are required. All top-ups must be signed via Freighter.",
        )

    verification = await verify_native_payment(
        body.stellar_tx_hash,
        source_public_key=body.sender_wallet,
        destination_public_key=settings.LINGAP_RECEIVER_PUBLIC_KEY,
        expected_amount=amount_xlm,
    )
    if not verification.get("confirmed"):
        raise HTTPException(
            status_code=400,
            detail=verification.get("reason") or "Stellar payment could not be verified on-chain.",
        )

    method_label = METHOD_LABELS.get(method, method.value)
    sender_info = body.sender_reference or body.sender_name or body.sender_wallet
    tx = BalanceTransaction(
        user_id=user.id,
        kind=BalanceTransactionKind.top_up,
        amount_xlm=amount_xlm,
        amount_php=xlm_to_php(amount_xlm, rate),
        payment_method=method,
        payment_reference=body.stellar_tx_hash,
        payment_status=BalancePaymentStatus.confirmed,
        stellar_tx_hash=body.stellar_tx_hash,
        note=(
            f"{method_label} top-up confirmed on Stellar. "
            f"Sender: {sender_info}."
        ),
    )
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    await record_top_up(tx)

    balance = await get_user_xlm_balance(db, user.id)
    return {
        "success": True,
        "message": "Top-up confirmed",
        "data": {
            "top_up": _read_transaction(tx).model_dump(),
            "balance": {
                "xlm_balance": balance,
                "php_equivalent": xlm_to_php(balance, rate),
                "xlm_to_php_rate": rate,
            },
        },
    }
