"""Build a ``RiskFeatures`` snapshot from the database for a given aid request."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.aid_request import AidRequest
from app.models.beneficiary import Beneficiary
from app.models.proof_artifact import ProofArtifact
from app.models.risk import FlagStatus, ScamFlag

from .base import ProofSummary, RiskFeatures

VELOCITY_WINDOW = timedelta(hours=24)


def _age_seconds(created_at: datetime) -> float:
    ts = created_at
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - ts).total_seconds()


async def build_features(
    db: AsyncSession, aid_request_id: uuid.UUID
) -> RiskFeatures | None:
    req = (
        await db.execute(select(AidRequest).where(AidRequest.id == aid_request_id))
    ).scalar_one_or_none()
    if not req:
        return None

    beneficiary = (
        await db.execute(
            select(Beneficiary).where(Beneficiary.id == req.beneficiary_id)
        )
    ).scalar_one_or_none()

    proof_rows = (
        await db.execute(
            select(ProofArtifact).where(
                ProofArtifact.aid_request_id == aid_request_id,
                ProofArtifact.deleted_at.is_(None),
            )
        )
    ).scalars().all()
    proofs = [
        ProofSummary(
            id=str(p.id),
            kind=p.kind.value if hasattr(p.kind, "value") else str(p.kind),
            mime=p.mime,
            size_bytes=int(p.size_bytes),
            claimed_amount=float(p.claimed_amount) if p.claimed_amount is not None else None,
            sha256=p.sha256,
        )
        for p in proof_rows
    ]

    flags_open = (
        await db.execute(
            select(func.count())
            .select_from(ScamFlag)
            .where(
                ScamFlag.aid_request_id == aid_request_id,
                ScamFlag.status == FlagStatus.open,
            )
        )
    ).scalar() or 0

    recent_cutoff = datetime.now(timezone.utc) - VELOCITY_WINDOW
    if beneficiary:
        recent_count = (
            await db.execute(
                select(func.count())
                .select_from(AidRequest)
                .where(
                    AidRequest.beneficiary_id == beneficiary.id,
                    AidRequest.created_at >= recent_cutoff,
                )
            )
        ).scalar() or 0
    else:
        recent_count = 0

    return RiskFeatures(
        aid_request_id=str(req.id),
        requested_amount=float(req.requested_amount),
        asset=req.asset,
        purpose=req.purpose or "",
        age_seconds=_age_seconds(req.created_at),
        beneficiary_id=str(req.beneficiary_id),
        beneficiary_verified=bool(beneficiary.verified) if beneficiary else False,
        beneficiary_total_received=float(beneficiary.total_received) if beneficiary else 0.0,
        beneficiary_location=beneficiary.location if beneficiary else "",
        proofs=proofs,
        prior_flags_open=int(flags_open),
        recent_request_count=int(recent_count),
        velocity_window_seconds=VELOCITY_WINDOW.total_seconds(),
    )
