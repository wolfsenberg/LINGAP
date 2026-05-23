from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.volunteer import (
    VolunteerOpportunity,
    VolunteerSignup,
    VolunteerCategory,
    OpportunityStatus,
)

router = APIRouter(prefix="/volunteer", tags=["volunteer"])


def _serialize(opp: VolunteerOpportunity, organizer_name: str, my_signup_status: str | None = None) -> dict:
    return {
        "id": str(opp.id),
        "organizer_id": str(opp.organizer_id),
        "organizer_name": organizer_name,
        "campaign_name": opp.campaign_name,
        "title": opp.title,
        "description": opp.description,
        "category": opp.category.value if hasattr(opp.category, "value") else opp.category,
        "skills_needed": [s.strip() for s in opp.skills_needed.split(",") if s.strip()] if opp.skills_needed else [],
        "location": opp.location,
        "schedule": opp.schedule,
        "slots": opp.slots,
        "slots_filled": opp.slots_filled,
        "slots_remaining": max(0, opp.slots - opp.slots_filled),
        "status": opp.status.value if hasattr(opp.status, "value") else opp.status,
        "urgent": opp.urgent,
        "my_signup_status": my_signup_status,
        "created_at": opp.created_at.isoformat() if opp.created_at else None,
    }


# ── Opportunities ─────────────────────────────────────────────────────────────

class OpportunityCreate(BaseModel):
    campaign_name: str
    title: str
    description: str
    category: VolunteerCategory = VolunteerCategory.other
    skills_needed: list[str] = []
    location: str
    schedule: str
    slots: int = 1
    urgent: bool = False


@router.get("/opportunities")
async def list_opportunities(
    category: VolunteerCategory | None = Query(None),
    status: OpportunityStatus = Query(OpportunityStatus.open),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    q = select(VolunteerOpportunity).where(VolunteerOpportunity.status == status)
    if category:
        q = q.where(VolunteerOpportunity.category == category)
    q = q.order_by(VolunteerOpportunity.urgent.desc(), VolunteerOpportunity.created_at.desc()).limit(limit)

    opps = (await db.execute(q)).scalars().all()
    total = (await db.execute(select(func.count()).select_from(VolunteerOpportunity).where(VolunteerOpportunity.status == status))).scalar()

    items = []
    for opp in opps:
        org = (await db.execute(select(User).where(User.id == opp.organizer_id))).scalar_one_or_none()
        items.append(_serialize(opp, org.name if org else "Unknown"))

    return {"success": True, "data": items, "total": total}


@router.post("/opportunities", status_code=201)
async def create_opportunity(
    body: OpportunityCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    opp = VolunteerOpportunity(
        organizer_id=user.id,
        campaign_name=body.campaign_name,
        title=body.title,
        description=body.description,
        category=body.category,
        skills_needed=", ".join(body.skills_needed),
        location=body.location,
        schedule=body.schedule,
        slots=body.slots,
        urgent=body.urgent,
    )
    db.add(opp)
    await db.commit()
    await db.refresh(opp)
    return {"success": True, "data": _serialize(opp, user.name)}


@router.get("/opportunities/{opportunity_id}")
async def get_opportunity(opportunity_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    opp = (await db.execute(select(VolunteerOpportunity).where(VolunteerOpportunity.id == opportunity_id))).scalar_one_or_none()
    if not opp:
        raise HTTPException(404, "Opportunity not found")
    org = (await db.execute(select(User).where(User.id == opp.organizer_id))).scalar_one_or_none()
    return {"success": True, "data": _serialize(opp, org.name if org else "Unknown")}


# ── Signups ───────────────────────────────────────────────────────────────────

class SignupCreate(BaseModel):
    message: str = ""
    skills: list[str] = []


@router.post("/opportunities/{opportunity_id}/apply", status_code=201)
async def apply_to_opportunity(
    opportunity_id: uuid.UUID,
    body: SignupCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    opp = (await db.execute(select(VolunteerOpportunity).where(VolunteerOpportunity.id == opportunity_id))).scalar_one_or_none()
    if not opp:
        raise HTTPException(404, "Opportunity not found")
    if opp.status != OpportunityStatus.open:
        raise HTTPException(400, "This opportunity is no longer accepting volunteers")

    existing = (
        await db.execute(
            select(VolunteerSignup).where(
                VolunteerSignup.opportunity_id == opportunity_id,
                VolunteerSignup.user_id == user.id,
            )
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(409, "You have already applied to this opportunity")

    signup = VolunteerSignup(
        opportunity_id=opportunity_id,
        user_id=user.id,
        message=body.message,
        skills=", ".join(body.skills),
    )
    db.add(signup)

    opp.slots_filled += 1
    if opp.slots_filled >= opp.slots:
        opp.status = OpportunityStatus.filled

    await db.commit()
    return {"success": True, "data": {"id": str(signup.id), "status": signup.status.value}}


@router.get("/me/signups")
async def my_signups(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = (
        await db.execute(
            select(VolunteerSignup, VolunteerOpportunity)
            .join(VolunteerOpportunity, VolunteerOpportunity.id == VolunteerSignup.opportunity_id)
            .where(VolunteerSignup.user_id == user.id)
            .order_by(VolunteerSignup.created_at.desc())
        )
    ).all()

    items = []
    for signup, opp in rows:
        org = (await db.execute(select(User).where(User.id == opp.organizer_id))).scalar_one_or_none()
        items.append({
            **_serialize(opp, org.name if org else "Unknown", my_signup_status=signup.status.value),
            "signup_id": str(signup.id),
            "applied_at": signup.created_at.isoformat() if signup.created_at else None,
        })

    return {"success": True, "data": items}


# ── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats")
async def volunteer_stats(db: AsyncSession = Depends(get_db)):
    open_count = (await db.execute(select(func.count()).select_from(VolunteerOpportunity).where(VolunteerOpportunity.status == OpportunityStatus.open))).scalar() or 0
    total_volunteers = (await db.execute(select(func.count()).select_from(VolunteerSignup))).scalar() or 0
    slots_needed = (await db.execute(select(func.sum(VolunteerOpportunity.slots - VolunteerOpportunity.slots_filled)).where(VolunteerOpportunity.status == OpportunityStatus.open))).scalar() or 0

    return {
        "success": True,
        "data": {
            "open_opportunities": int(open_count),
            "total_volunteers": int(total_volunteers),
            "slots_needed": int(slots_needed),
        },
    }
