"""Donor monthly streak + reward history models."""
from __future__ import annotations

import enum
import uuid
from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

from .mixins import TimestampMixin


class StreakTier(str, enum.Enum):
    none = "none"
    spark = "spark"
    flame = "flame"
    blaze = "blaze"
    inferno = "inferno"


TIER_THRESHOLDS = {
    StreakTier.spark: 1,
    StreakTier.flame: 3,
    StreakTier.blaze: 6,
    StreakTier.inferno: 12,
}


def tier_for_streak(months: int) -> StreakTier:
    if months >= TIER_THRESHOLDS[StreakTier.inferno]:
        return StreakTier.inferno
    if months >= TIER_THRESHOLDS[StreakTier.blaze]:
        return StreakTier.blaze
    if months >= TIER_THRESHOLDS[StreakTier.flame]:
        return StreakTier.flame
    if months >= TIER_THRESHOLDS[StreakTier.spark]:
        return StreakTier.spark
    return StreakTier.none


class DonorStreak(Base, TimestampMixin):
    """Cached streak state per donor; one row per user."""

    __tablename__ = "donor_streaks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), unique=True, index=True
    )
    current_streak_months: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak_months: Mapped[int] = mapped_column(Integer, default=0)
    last_donation_month: Mapped[date | None] = mapped_column(Date)
    total_confirmed_donations: Mapped[int] = mapped_column(Integer, default=0)
    tier: Mapped[StreakTier] = mapped_column(
        Enum(StreakTier), default=StreakTier.none, index=True
    )


class StreakReward(Base, TimestampMixin):
    """One row per tier unlock, so the UI can animate / show history."""

    __tablename__ = "streak_rewards"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    tier_unlocked: Mapped[StreakTier] = mapped_column(Enum(StreakTier))
    streak_at_unlock: Mapped[int] = mapped_column(Integer)
