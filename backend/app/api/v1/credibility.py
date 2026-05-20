"""Beneficiary credibility endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_aid_worker_or_admin
from app.credibility.service import credibility_service
from app.models.beneficiary import Beneficiary
from app.models.credibility import CredibilityAssessment
from app.models.user import User
from app.schemas.credibility import (
    CredibilityAssessmentRead,
    CredibilityHistory,
    CredibilityRead,
)

router = APIRouter(prefix="/beneficiaries/{beneficiary_id}/credibility", tags=["credibility"])


async def _get_beneficiary(db: AsyncSession, beneficiary_id: uuid.UUID) -> Beneficiary:
    beneficiary = (
        await db.execute(select(Beneficiary).where(Beneficiary.id == beneficiary_id))
    ).scalar_one_or_none()
    if not beneficiary:
        raise HTTPException(404, "Beneficiary not found")
    return beneficiary


@router.get("", response_model=CredibilityRead)
async def get_credibility(
    beneficiary_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Return the most recent credibility snapshot for the beneficiary.

    If no snapshot has been computed yet, this lazily generates one so the
    caller never sees an empty payload after the first request.
    """
    beneficiary = await _get_beneficiary(db, beneficiary_id)

    latest = (
        await db.execute(
            select(CredibilityAssessment)
            .where(CredibilityAssessment.beneficiary_id == beneficiary_id)
            .order_by(CredibilityAssessment.created_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()

    if latest is None:
        latest = await credibility_service.assess(db, beneficiary_id)

    if latest is None:
        return CredibilityRead(
            beneficiary_id=beneficiary_id,
            score=None,
            tier=None,
            breakdown={},
            recomputed_at=None,
        )

    return CredibilityRead(
        beneficiary_id=beneficiary_id,
        score=float(beneficiary.cached_credibility_score) if beneficiary.cached_credibility_score is not None else float(latest.score),
        tier=beneficiary.cached_credibility_tier or latest.tier,
        breakdown=latest.breakdown or {},
        recomputed_at=beneficiary.credibility_recomputed_at or latest.created_at,
    )


@router.post("/recompute", response_model=CredibilityAssessmentRead)
async def recompute_credibility(
    beneficiary_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_aid_worker_or_admin),
):
    await _get_beneficiary(db, beneficiary_id)
    assessment = await credibility_service.assess(db, beneficiary_id, force=True)
    if assessment is None:
        raise HTTPException(404, "Could not build credibility features")
    return CredibilityAssessmentRead.model_validate(assessment)


@router.get("/history", response_model=CredibilityHistory)
async def list_credibility_history(
    beneficiary_id: uuid.UUID,
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_aid_worker_or_admin),
):
    await _get_beneficiary(db, beneficiary_id)
    items = (
        await db.execute(
            select(CredibilityAssessment)
            .where(CredibilityAssessment.beneficiary_id == beneficiary_id)
            .order_by(CredibilityAssessment.created_at.desc())
            .limit(limit)
        )
    ).scalars().all()
    total = (
        await db.execute(
            select(func.count())
            .select_from(CredibilityAssessment)
            .where(CredibilityAssessment.beneficiary_id == beneficiary_id)
        )
    ).scalar() or 0
    return CredibilityHistory(
        items=[CredibilityAssessmentRead.model_validate(a) for a in items],
        total=int(total),
    )
