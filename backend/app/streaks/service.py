"""Donor streak orchestration service."""
from __future__ import annotations

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.donation import Donation
from app.models.donor_streak import (
    TIER_THRESHOLDS,
    DonorStreak,
    StreakReward,
    StreakTier,
)

from .engine import StreakState, compute_streak

log = logging.getLogger(__name__)

TIER_ORDER = [
    StreakTier.spark,
    StreakTier.flame,
    StreakTier.blaze,
    StreakTier.inferno,
]


def _tier_rank(tier: StreakTier) -> int:
    return TIER_ORDER.index(tier) if tier in TIER_ORDER else -1


class StreakService:
    async def recompute(self, db: AsyncSession, user_id: uuid.UUID) -> DonorStreak:
        donations = (
            await db.execute(
                select(Donation).where(
                    Donation.donor_id == user_id,
                    Donation.blockchain_confirmed.is_(True),
                )
            )
        ).scalars().all()

        state: StreakState = compute_streak([d.created_at for d in donations])

        row = (
            await db.execute(
                select(DonorStreak).where(DonorStreak.user_id == user_id)
            )
        ).scalar_one_or_none()
        previous_tier = row.tier if row else StreakTier.none
        previous_longest = row.longest_streak_months if row else 0

        if row is None:
            row = DonorStreak(user_id=user_id)
            db.add(row)

        row.current_streak_months = state.current_streak_months
        row.longest_streak_months = max(previous_longest, state.longest_streak_months)
        row.last_donation_month = state.last_donation_month
        row.total_confirmed_donations = state.total_confirmed_donations
        row.tier = state.tier

        # Emit StreakReward rows for any new tier ranks crossed since last run.
        if _tier_rank(state.tier) > _tier_rank(previous_tier):
            new_tiers = [
                t for t in TIER_ORDER
                if _tier_rank(previous_tier) < _tier_rank(t) <= _tier_rank(state.tier)
            ]
            for tier in new_tiers:
                db.add(
                    StreakReward(
                        user_id=user_id,
                        tier_unlocked=tier,
                        streak_at_unlock=TIER_THRESHOLDS[tier],
                    )
                )

        await db.commit()
        await db.refresh(row)
        return row

    async def get(self, db: AsyncSession, user_id: uuid.UUID) -> DonorStreak | None:
        return (
            await db.execute(
                select(DonorStreak).where(DonorStreak.user_id == user_id)
            )
        ).scalar_one_or_none()


streak_service = StreakService()
