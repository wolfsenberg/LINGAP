"""Risk orchestration service.

Persists ``RiskAssessment`` snapshots and derives ``ScamFlag`` rows for
medium-or-higher flags. Idempotent on ``inputs_hash`` per (aid_request, engine).
"""
from __future__ import annotations

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.aid_request import AidRequest
from app.models.risk import (
    FlagSeverity,
    FlagSource,
    FlagStatus,
    RiskAssessment,
    RiskEngineKind,
    ScamFlag,
)

from .base import RiskEngine, RiskFeatures, RiskResult, score_to_level
from .features import build_features
from .rules import rules_engine

log = logging.getLogger(__name__)

SEVERITY_RANK = {"low": 0, "medium": 1, "high": 2, "critical": 3}
PERSISTED_SEVERITY_THRESHOLD = "medium"


def _pick_engine() -> RiskEngine:
    if settings.RISK_ENGINE == "llm" and settings.OPENAI_API_KEY:
        from .llm import llm_engine  # local import keeps openai optional
        return llm_engine
    return rules_engine


def _engine_kind(engine: RiskEngine) -> RiskEngineKind:
    return RiskEngineKind.llm if engine.name == "llm" else RiskEngineKind.rules


class RiskService:
    """Stateless orchestrator. Methods accept an open AsyncSession."""

    async def assess(
        self, db: AsyncSession, aid_request_id: uuid.UUID, *, force: bool = False
    ) -> RiskAssessment | None:
        features = await build_features(db, aid_request_id)
        if features is None:
            return None
        return await self._run(db, aid_request_id, features, force=force)

    async def rescan(
        self,
        db: AsyncSession,
        aid_request_id: uuid.UUID,
        reason: str = "rescan",
    ) -> RiskAssessment | None:
        log.info("Risk rescan for %s reason=%s", aid_request_id, reason)
        return await self.assess(db, aid_request_id)

    async def _run(
        self,
        db: AsyncSession,
        aid_request_id: uuid.UUID,
        features: RiskFeatures,
        *,
        force: bool,
    ) -> RiskAssessment:
        inputs_hash = features.stable_hash()
        engine = _pick_engine()
        engine_kind = _engine_kind(engine)

        if not force:
            existing = (
                await db.execute(
                    select(RiskAssessment)
                    .where(
                        RiskAssessment.aid_request_id == aid_request_id,
                        RiskAssessment.engine == engine_kind,
                        RiskAssessment.inputs_hash == inputs_hash,
                    )
                    .order_by(RiskAssessment.created_at.desc())
                    .limit(1)
                )
            ).scalar_one_or_none()
            if existing:
                return existing

        result: RiskResult = await engine.assess(features)
        result.score = max(0.0, min(100.0, float(result.score)))
        result.level = score_to_level(result.score) if not result.level else result.level

        assessment = RiskAssessment(
            aid_request_id=aid_request_id,
            engine=engine_kind,
            score=result.score,
            level=result.level,
            flags=[
                {"type": f.type, "severity": f.severity, "reason": f.reason}
                for f in result.flags
            ],
            reasoning=result.reasoning,
            model_version=result.model_version,
            inputs_hash=inputs_hash,
        )
        db.add(assessment)

        # Update cached level/score on the AidRequest.
        req = (
            await db.execute(select(AidRequest).where(AidRequest.id == aid_request_id))
        ).scalar_one_or_none()
        if req is not None:
            req.cached_risk_score = result.score
            req.cached_risk_level = result.level

        # Derive ScamFlag rows for medium+ severities not already open.
        existing_open = {
            (sf.flag_type, sf.severity.value)
            for sf in (
                await db.execute(
                    select(ScamFlag).where(
                        ScamFlag.aid_request_id == aid_request_id,
                        ScamFlag.status == FlagStatus.open,
                    )
                )
            ).scalars().all()
        }
        for f in result.flags:
            if SEVERITY_RANK.get(f.severity, 0) < SEVERITY_RANK[PERSISTED_SEVERITY_THRESHOLD]:
                continue
            if (f.type, f.severity) in existing_open:
                continue
            try:
                severity_enum = FlagSeverity(f.severity)
            except ValueError:
                severity_enum = FlagSeverity.medium
            db.add(
                ScamFlag(
                    aid_request_id=aid_request_id,
                    source=FlagSource.llm if engine_kind == RiskEngineKind.llm else FlagSource.rule,
                    severity=severity_enum,
                    flag_type=f.type,
                    details=f.details or {},
                    status=FlagStatus.open,
                )
            )

        await db.commit()
        await db.refresh(assessment)
        return assessment


risk_service = RiskService()
