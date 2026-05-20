"""Pure functions for computing monthly donor streaks.

The engine operates on plain timestamps so it can be unit-tested without the
DB. Months are calendar months in UTC. The current streak is the longest
run of consecutive months ending at the most recent donation month.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Iterable

from app.models.donor_streak import TIER_THRESHOLDS, StreakTier, tier_for_streak


def _first_of_month(ts: datetime) -> date:
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    ts_utc = ts.astimezone(timezone.utc)
    return date(ts_utc.year, ts_utc.month, 1)


def _prev_month(d: date) -> date:
    if d.month == 1:
        return date(d.year - 1, 12, 1)
    return date(d.year, d.month - 1, 1)


def _months_between(later: date, earlier: date) -> int:
    return (later.year - earlier.year) * 12 + (later.month - earlier.month)


@dataclass
class StreakState:
    current_streak_months: int
    longest_streak_months: int
    last_donation_month: date | None
    total_confirmed_donations: int
    tier: StreakTier

    def to_dict(self) -> dict:
        return {
            "current_streak_months": self.current_streak_months,
            "longest_streak_months": self.longest_streak_months,
            "last_donation_month": (
                self.last_donation_month.isoformat() if self.last_donation_month else None
            ),
            "total_confirmed_donations": self.total_confirmed_donations,
            "tier": self.tier.value,
        }


def compute_streak(donation_timestamps: Iterable[datetime]) -> StreakState:
    """Compute streak state from confirmed donation timestamps.

    Consecutive calendar months (UTC) accumulate; any gap resets the active
    run. Longest is the max run seen across history.
    """
    months = sorted({_first_of_month(ts) for ts in donation_timestamps})
    total = sum(1 for _ in donation_timestamps)

    if not months:
        return StreakState(0, 0, None, total, StreakTier.none)

    longest = 1
    run = 1
    for i in range(1, len(months)):
        if _months_between(months[i], months[i - 1]) == 1:
            run += 1
        else:
            longest = max(longest, run)
            run = 1
    longest = max(longest, run)

    last_month = months[-1]

    current = 1
    cursor = last_month
    for prior in reversed(months[:-1]):
        if prior == _prev_month(cursor):
            current += 1
            cursor = prior
        else:
            break

    return StreakState(
        current_streak_months=current,
        longest_streak_months=longest,
        last_donation_month=last_month,
        total_confirmed_donations=total,
        tier=tier_for_streak(current),
    )


def months_to_next_tier(current: int) -> tuple[StreakTier | None, int | None]:
    """Return (next_tier, months_remaining). None if already at the top."""
    for tier in (StreakTier.spark, StreakTier.flame, StreakTier.blaze, StreakTier.inferno):
        threshold = TIER_THRESHOLDS[tier]
        if current < threshold:
            return tier, threshold - current
    return None, None
