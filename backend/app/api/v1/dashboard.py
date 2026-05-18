from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.donation import Donation
from app.models.beneficiary import Beneficiary
from app.models.aid_request import AidRequest, AidRequestStatus
from app.models.provenance import ProvenanceRecord

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    total_donations = (await db.execute(select(func.sum(Donation.amount)))).scalar() or 0
    total_disbursed = (await db.execute(select(func.sum(Donation.disbursed_amount)))).scalar() or 0
    active_beneficiaries = (
        await db.execute(select(func.count()).select_from(Beneficiary).where(Beneficiary.verified == True))  # noqa: E712
    ).scalar() or 0
    pending_requests = (
        await db.execute(
            select(func.count()).select_from(AidRequest).where(AidRequest.status == AidRequestStatus.pending)
        )
    ).scalar() or 0

    utilization = (total_disbursed / total_donations * 100) if total_donations else 0

    recent_txs = (
        await db.execute(
            select(ProvenanceRecord).order_by(ProvenanceRecord.created_at.desc()).limit(10)
        )
    ).scalars().all()

    return {
        "success": True,
        "message": "ok",
        "data": {
            "totalDonations": float(total_donations),
            "totalDisbursed": float(total_disbursed),
            "activeBeneficiaries": active_beneficiaries,
            "pendingRequests": pending_requests,
            "fundUtilizationRate": round(utilization, 2),
            "recentTransactions": [
                {
                    "id": str(r.id),
                    "donationId": str(r.donation_id),
                    "aidRequestId": str(r.aid_request_id),
                    "beneficiaryId": str(r.beneficiary_id),
                    "amount": float(r.amount),
                    "asset": r.asset,
                    "contractAddress": r.contract_address,
                    "stellarTxHash": r.stellar_tx_hash,
                    "ledger": r.ledger,
                    "timestamp": r.created_at.isoformat(),
                }
                for r in recent_txs
            ],
        },
    }
