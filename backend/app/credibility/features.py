"""Build CredibilityFeatures from the database."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.aid_request import AidRequest, AidRequestStatus
from app.models.beneficiary import Beneficiary
from app.models.progress_update import (
    ProgressUpdate,
    VerifierConfirmation,
    VerifyDecision,
)
from app.models.risk import FlagStatus, RiskAssessment, ScamFlag

from .engine import CredibilityFeatures


async def build_features(
    db: AsyncSession, beneficiary_id: uuid.UUID
) -> CredibilityFeatures | None:
    beneficiary = (
        await db.execute(select(Beneficiary).where(Beneficiary.id == beneficiary_id))
    ).scalar_one_or_none()
    if beneficiary is None:
        return None

    aid_requests = (
        await db.execute(
            select(AidRequest).where(AidRequest.beneficiary_id == beneficiary_id)
        )
    ).scalars().all()
    request_ids = [r.id for r in aid_requests]
    aid_request_count = len(aid_requests)
    disbursed_count = sum(1 for r in aid_requests if r.status == AidRequestStatus.disbursed)
    rejected_count = sum(1 for r in aid_requests if r.status == AidRequestStatus.rejected)
    proof_count = sum(int(r.proof_count or 0) for r in aid_requests)

    if request_ids:
        confirmed_q = (
            select(func.count())
            .select_from(VerifierConfirmation)
            .join(
                ProgressUpdate,
                ProgressUpdate.id == VerifierConfirmation.progress_update_id,
            )
            .where(
                ProgressUpdate.aid_request_id.in_(request_ids),
                VerifierConfirmation.decision == VerifyDecision.confirmed,
            )
        )
        disputed_q = (
            select(func.count())
            .select_from(VerifierConfirmation)
            .join(
                ProgressUpdate,
                ProgressUpdate.id == VerifierConfirmation.progress_update_id,
            )
            .where(
                ProgressUpdate.aid_request_id.in_(request_ids),
                VerifierConfirmation.decision == VerifyDecision.disputed,
            )
        )
        flags_q = (
            select(func.count())
            .select_from(ScamFlag)
            .where(
                ScamFlag.aid_request_id.in_(request_ids),
                ScamFlag.status == FlagStatus.open,
            )
        )
        risk_q = (
            select(RiskAssessment.score)
            .where(RiskAssessment.aid_request_id.in_(request_ids))
            .order_by(RiskAssessment.created_at.desc())
            .limit(5)
        )
        confirmed = (await db.execute(confirmed_q)).scalar() or 0
        disputed = (await db.execute(disputed_q)).scalar() or 0
        open_flags = (await db.execute(flags_q)).scalar() or 0
        recent_scores = [float(s) for s in (await db.execute(risk_q)).scalars().all()]
        avg_recent_risk = sum(recent_scores) / len(recent_scores) if recent_scores else None
    else:
        confirmed = 0
        disputed = 0
        open_flags = 0
        avg_recent_risk = None

    created_at = beneficiary.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    age_seconds = (datetime.now(timezone.utc) - created_at).total_seconds()
    account_age_months = age_seconds / (60 * 60 * 24 * 30.4375)

    return CredibilityFeatures(
        beneficiary_id=str(beneficiary.id),
        kyc_verified=bool(beneficiary.verified),
        aid_request_count=aid_request_count,
        proof_count=proof_count,
        disbursed_count=disbursed_count,
        rejected_count=rejected_count,
        confirmed_verifications=int(confirmed),
        disputed_verifications=int(disputed),
        avg_recent_risk_score=avg_recent_risk,
        open_scam_flags=int(open_flags),
        account_age_months=round(account_age_months, 3),
    )
