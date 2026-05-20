"""Spending comparison: requested vs. claimed totals from uploaded proofs."""
from __future__ import annotations

import uuid
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.aid_request import AidRequest
from app.models.proof_artifact import ProofArtifact
from app.models.risk import SpendingComparison


async def recompute_spending(
    db: AsyncSession, aid_request_id: uuid.UUID
) -> SpendingComparison | None:
    req = (
        await db.execute(select(AidRequest).where(AidRequest.id == aid_request_id))
    ).scalar_one_or_none()
    if not req:
        return None

    proofs = (
        await db.execute(
            select(ProofArtifact).where(
                ProofArtifact.aid_request_id == aid_request_id,
                ProofArtifact.deleted_at.is_(None),
            )
        )
    ).scalars().all()

    breakdown: dict[str, float] = defaultdict(float)
    claimed_total = 0.0
    for p in proofs:
        amt = float(p.claimed_amount) if p.claimed_amount is not None else 0.0
        claimed_total += amt
        kind = p.kind.value if hasattr(p.kind, "value") else str(p.kind)
        breakdown[kind] += amt

    requested = float(req.requested_amount)
    variance = 0.0
    if requested > 0:
        variance = abs(requested - claimed_total) / requested * 100.0

    snapshot = SpendingComparison(
        aid_request_id=aid_request_id,
        requested_amount=requested,
        claimed_total=claimed_total,
        variance_pct=round(variance, 4),
        breakdown={k: round(v, 4) for k, v in breakdown.items()},
    )
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    return snapshot
