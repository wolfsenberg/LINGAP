"""AI-Assisted Spending and Risk Audit endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.service import risk_service
from app.ai.spending import recompute_spending
from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_admin,
    require_aid_worker_or_admin,
)
from app.models.aid_request import AidRequest
from app.models.risk import (
    FlagSeverity,
    FlagStatus,
    RiskAssessment,
    ScamFlag,
    SpendingComparison,
)
from app.models.user import User
from app.schemas.risk import (
    RiskAssessmentRead,
    ScamFlagPatch,
    ScamFlagRead,
    SpendingComparisonRead,
)

router = APIRouter(prefix="/risk", tags=["risk"])
aid_request_risk_router = APIRouter(
    prefix="/aid-requests/{request_id}/risk", tags=["risk"]
)
aid_request_spending_router = APIRouter(
    prefix="/aid-requests/{request_id}/spending", tags=["risk"]
)


async def _require_request(db: AsyncSession, request_id: uuid.UUID) -> AidRequest:
    req = (
        await db.execute(select(AidRequest).where(AidRequest.id == request_id))
    ).scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Aid request not found")
    return req


@aid_request_risk_router.post(
    "/scan", status_code=201, response_model=RiskAssessmentRead
)
async def scan_risk(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_aid_worker_or_admin),
):
    await _require_request(db, request_id)
    assessment = await risk_service.assess(db, request_id, force=True)
    if assessment is None:
        raise HTTPException(404, "Aid request not found")
    await recompute_spending(db, request_id)
    return RiskAssessmentRead.model_validate(assessment)


@aid_request_risk_router.get("", response_model=list[RiskAssessmentRead])
async def get_risk_history(
    request_id: uuid.UUID,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    await _require_request(db, request_id)
    rows = (
        await db.execute(
            select(RiskAssessment)
            .where(RiskAssessment.aid_request_id == request_id)
            .order_by(RiskAssessment.created_at.desc())
            .limit(limit)
        )
    ).scalars().all()
    return [RiskAssessmentRead.model_validate(r) for r in rows]


@aid_request_spending_router.get("", response_model=SpendingComparisonRead)
async def get_spending(
    request_id: uuid.UUID,
    refresh: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    await _require_request(db, request_id)
    if refresh:
        snap = await recompute_spending(db, request_id)
    else:
        snap = (
            await db.execute(
                select(SpendingComparison)
                .where(SpendingComparison.aid_request_id == request_id)
                .order_by(SpendingComparison.created_at.desc())
                .limit(1)
            )
        ).scalar_one_or_none()
        if snap is None:
            snap = await recompute_spending(db, request_id)
    if snap is None:
        raise HTTPException(404, "Spending snapshot unavailable")
    return SpendingComparisonRead.model_validate(snap)


@router.get("/flags")
async def list_flags(
    status: FlagStatus | None = Query(None),
    severity: FlagSeverity | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = select(ScamFlag).order_by(ScamFlag.created_at.desc())
    cnt_q = select(func.count()).select_from(ScamFlag)
    if status:
        q = q.where(ScamFlag.status == status)
        cnt_q = cnt_q.where(ScamFlag.status == status)
    if severity:
        q = q.where(ScamFlag.severity == severity)
        cnt_q = cnt_q.where(ScamFlag.severity == severity)
    offset = (page - 1) * size
    rows = (await db.execute(q.offset(offset).limit(size))).scalars().all()
    total = (await db.execute(cnt_q)).scalar() or 0
    return {
        "items": [ScamFlagRead.model_validate(r) for r in rows],
        "total": total,
        "page": page,
        "size": size,
        "pages": -(-total // size) if total else 0,
    }


@router.patch("/flags/{flag_id}", response_model=ScamFlagRead)
async def update_flag(
    flag_id: uuid.UUID,
    body: ScamFlagPatch,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    flag = (
        await db.execute(select(ScamFlag).where(ScamFlag.id == flag_id))
    ).scalar_one_or_none()
    if not flag:
        raise HTTPException(404, "Flag not found")
    flag.status = body.status
    flag.resolution_note = body.resolution_note
    flag.reviewer_id = admin.id
    await db.commit()
    await db.refresh(flag)
    return ScamFlagRead.model_validate(flag)
