"""Credibility orchestration service.

Mirrors ``RiskService``: persists ``CredibilityAssessment`` snapshots and
caches the latest score/tier on ``Beneficiary``. Idempotent on
``inputs_hash`` unless ``force=True``.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.beneficiary import Beneficiary
from app.models.credibility import CredibilityAssessment

from .engine import ENGINE_VERSION, compute
from .features import build_features

log = logging.getLogger(__name__)


class CredibilityService:
    async def assess(
        self,
        db: AsyncSession,
        beneficiary_id: uuid.UUID,
        *,
        force: bool = False,
    ) -> CredibilityAssessment | None:
        features = await build_features(db, beneficiary_id)
        if features is None:
            return None

        inputs_hash = features.stable_hash()

        if not force:
            existing = (
                await db.execute(
                    select(CredibilityAssessment)
                    .where(
                        CredibilityAssessment.beneficiary_id == beneficiary_id,
                        CredibilityAssessment.inputs_hash == inputs_hash,
                    )
                    .order_by(CredibilityAssessment.created_at.desc())
                    .limit(1)
                )
            ).scalar_one_or_none()
            if existing:
                return existing

        result = compute(features)
        assessment = CredibilityAssessment(
            beneficiary_id=beneficiary_id,
            score=result.score,
            tier=result.tier,
            breakdown=result.to_breakdown(),
            engine_version=ENGINE_VERSION,
            inputs_hash=inputs_hash,
        )
        db.add(assessment)

        beneficiary = (
            await db.execute(
                select(Beneficiary).where(Beneficiary.id == beneficiary_id)
            )
        ).scalar_one_or_none()
        if beneficiary is not None:
            beneficiary.cached_credibility_score = result.score
            beneficiary.cached_credibility_tier = result.tier
            beneficiary.credibility_recomputed_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(assessment)
        return assessment

    async def rescan(
        self,
        db: AsyncSession,
        beneficiary_id: uuid.UUID,
        reason: str = "rescan",
    ) -> CredibilityAssessment | None:
        log.info("Credibility rescan for %s reason=%s", beneficiary_id, reason)
        return await self.assess(db, beneficiary_id)


credibility_service = CredibilityService()
