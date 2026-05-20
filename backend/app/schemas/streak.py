"""Pydantic schemas for the donor streak API."""
from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.donor_streak import StreakTier


class StreakRead(BaseModel):
    user_id: UUID
    current_streak_months: int
    longest_streak_months: int
    last_donation_month: date | None
    total_confirmed_donations: int
    tier: StreakTier
    next_tier: StreakTier | None
    months_to_next_tier: int | None


class StreakRewardRead(BaseModel):
    id: UUID
    user_id: UUID
    tier_unlocked: StreakTier
    streak_at_unlock: int
    created_at: datetime

    model_config = {"from_attributes": True}


class StreakRewardList(BaseModel):
    items: list[StreakRewardRead]
    total: int


class LeaderboardEntry(BaseModel):
    user_id: UUID
    name: str | None = None
    current_streak_months: int
    longest_streak_months: int
    tier: StreakTier


class StreakLeaderboard(BaseModel):
    items: list[LeaderboardEntry]
    total: int
