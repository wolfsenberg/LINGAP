"""Donor monthly streak endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.donor_streak import DonorStreak, StreakReward, StreakTier
from app.models.user import User
from app.schemas.streak import (
    LeaderboardEntry,
    StreakLeaderboard,
    StreakRead,
    StreakRewardList,
    StreakRewardRead,
)
from app.streaks.engine import months_to_next_tier
from app.streaks.service import streak_service

donor_router = APIRouter(prefix="/donors/me", tags=["streaks"])
admin_router = APIRouter(prefix="/streaks", tags=["streaks"])


def _to_read(row: DonorStreak, user_id) -> StreakRead:
    next_tier, remaining = months_to_next_tier(row.current_streak_months)
    return StreakRead(
        user_id=user_id,
        current_streak_months=row.current_streak_months,
        longest_streak_months=row.longest_streak_months,
        last_donation_month=row.last_donation_month,
        total_confirmed_donations=row.total_confirmed_donations,
        tier=row.tier,
        next_tier=next_tier,
        months_to_next_tier=remaining,
    )


@donor_router.get("/streak", response_model=StreakRead)
async def get_my_streak(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = await streak_service.get(db, user.id)
    if row is None:
        row = await streak_service.recompute(db, user.id)
    return _to_read(row, user.id)


@donor_router.post("/streak/recompute", response_model=StreakRead)
async def recompute_my_streak(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = await streak_service.recompute(db, user.id)
    return _to_read(row, user.id)


@donor_router.get("/rewards", response_model=StreakRewardList)
async def list_my_rewards(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    items = (
        await db.execute(
            select(StreakReward)
            .where(StreakReward.user_id == user.id)
            .order_by(StreakReward.created_at.asc())
        )
    ).scalars().all()
    total = (
        await db.execute(
            select(func.count()).select_from(StreakReward).where(StreakReward.user_id == user.id)
        )
    ).scalar() or 0
    return StreakRewardList(
        items=[StreakRewardRead.model_validate(r) for r in items],
        total=int(total),
    )


@admin_router.get("/leaderboard", response_model=StreakLeaderboard)
async def streak_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    tier: StreakTier | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = (
        select(DonorStreak, User)
        .join(User, User.id == DonorStreak.user_id)
        .order_by(DonorStreak.current_streak_months.desc())
    )
    if tier is not None:
        q = q.where(DonorStreak.tier == tier)
    q = q.limit(limit)

    rows = (await db.execute(q)).all()
    items = [
        LeaderboardEntry(
            user_id=ds.user_id,
            name=u.name,
            current_streak_months=ds.current_streak_months,
            longest_streak_months=ds.longest_streak_months,
            tier=ds.tier,
        )
        for ds, u in rows
    ]
    total = (
        await db.execute(select(func.count()).select_from(DonorStreak))
    ).scalar() or 0
    return StreakLeaderboard(items=items, total=int(total))
