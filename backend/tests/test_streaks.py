"""Tests for donor streak engine, service, and endpoints."""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

import pytest

from app.models.donor_streak import StreakTier
from app.streaks.engine import compute_streak, months_to_next_tier
from app.streaks.service import streak_service


def _utc(year: int, month: int, day: int = 15) -> datetime:
    return datetime(year, month, day, 12, 0, tzinfo=timezone.utc)


def test_compute_streak_empty():
    state = compute_streak([])
    assert state.current_streak_months == 0
    assert state.longest_streak_months == 0
    assert state.tier == StreakTier.none
    assert state.last_donation_month is None


def test_compute_streak_single_month_is_spark():
    state = compute_streak([_utc(2026, 5)])
    assert state.current_streak_months == 1
    assert state.longest_streak_months == 1
    assert state.tier == StreakTier.spark


def test_compute_streak_three_consecutive_is_flame():
    state = compute_streak([_utc(2026, 3), _utc(2026, 4), _utc(2026, 5)])
    assert state.current_streak_months == 3
    assert state.tier == StreakTier.flame


def test_compute_streak_dedupes_within_month():
    state = compute_streak(
        [
            _utc(2026, 5, 1),
            _utc(2026, 5, 15),
            _utc(2026, 5, 28),
        ]
    )
    assert state.current_streak_months == 1
    assert state.total_confirmed_donations == 3


def test_compute_streak_gap_resets_current_but_longest_remembers():
    state = compute_streak(
        [
            _utc(2025, 1),
            _utc(2025, 2),
            _utc(2025, 3),  # longest run = 3
            _utc(2025, 6),  # gap, current resets
            _utc(2025, 7),
        ]
    )
    assert state.current_streak_months == 2
    assert state.longest_streak_months == 3
    assert state.tier == StreakTier.spark


def test_compute_streak_twelve_consecutive_is_inferno():
    months = [_utc(2025, m) for m in range(1, 13)]
    state = compute_streak(months)
    assert state.current_streak_months == 12
    assert state.tier == StreakTier.inferno


def test_compute_streak_crosses_year_boundary():
    state = compute_streak(
        [
            _utc(2025, 11),
            _utc(2025, 12),
            _utc(2026, 1),
            _utc(2026, 2),
        ]
    )
    assert state.current_streak_months == 4
    assert state.last_donation_month == date(2026, 2, 1)


def test_months_to_next_tier():
    next_tier, remaining = months_to_next_tier(0)
    assert next_tier == StreakTier.spark
    assert remaining == 1

    next_tier, remaining = months_to_next_tier(1)
    assert next_tier == StreakTier.flame
    assert remaining == 2

    next_tier, remaining = months_to_next_tier(12)
    assert next_tier is None
    assert remaining is None


async def _make_user(db_session, *, role="donor"):
    from app.core.security import create_access_token, hash_password
    from app.models.user import User, UserRole

    user = User(
        id=uuid.uuid4(),
        email=f"streak-{uuid.uuid4().hex[:6]}@test.io",
        name="Streak User",
        hashed_password=hash_password("pass1234"),
        role=UserRole(role),
    )
    db_session.add(user)
    await db_session.commit()
    token = create_access_token(str(user.id))
    return user, {"Authorization": f"Bearer {token}"}


async def _insert_donation(db_session, user_id, when: datetime, *, confirmed: bool = True):
    from app.models.donation import Donation

    d = Donation(
        id=uuid.uuid4(),
        donor_id=user_id,
        amount=10,
        asset="XLM",
        stellar_tx_hash=uuid.uuid4().hex,
        blockchain_confirmed=confirmed,
        disbursed=False,
        disbursed_amount=0,
    )
    db_session.add(d)
    await db_session.commit()
    await db_session.refresh(d)
    # created_at defaults to now; override for deterministic streak tests.
    d.created_at = when
    await db_session.commit()
    return d


@pytest.mark.asyncio
async def test_service_recompute_inserts_row_and_rewards(db_session):
    from sqlalchemy import select

    from app.models.donor_streak import DonorStreak, StreakReward

    user, _ = await _make_user(db_session)
    await _insert_donation(db_session, user.id, _utc(2026, 3))
    await _insert_donation(db_session, user.id, _utc(2026, 4))
    await _insert_donation(db_session, user.id, _utc(2026, 5))

    row = await streak_service.recompute(db_session, user.id)
    assert row.current_streak_months == 3
    assert row.tier == StreakTier.flame

    rewards = (
        await db_session.execute(
            select(StreakReward).where(StreakReward.user_id == user.id)
        )
    ).scalars().all()
    unlocked = {r.tier_unlocked for r in rewards}
    assert StreakTier.spark in unlocked
    assert StreakTier.flame in unlocked

    # Recompute idempotent — same state, no extra rewards.
    await streak_service.recompute(db_session, user.id)
    rewards_after = (
        await db_session.execute(
            select(StreakReward).where(StreakReward.user_id == user.id)
        )
    ).scalars().all()
    assert len(rewards_after) == len(rewards)

    rows = (
        await db_session.execute(
            select(DonorStreak).where(DonorStreak.user_id == user.id)
        )
    ).scalars().all()
    assert len(rows) == 1


@pytest.mark.asyncio
async def test_service_ignores_unconfirmed_donations(db_session):
    user, _ = await _make_user(db_session)
    await _insert_donation(db_session, user.id, _utc(2026, 3), confirmed=False)
    await _insert_donation(db_session, user.id, _utc(2026, 4), confirmed=False)
    await _insert_donation(db_session, user.id, _utc(2026, 5), confirmed=True)

    row = await streak_service.recompute(db_session, user.id)
    assert row.current_streak_months == 1
    assert row.total_confirmed_donations == 1
    assert row.tier == StreakTier.spark


@pytest.mark.asyncio
async def test_get_my_streak_endpoint_lazy_initializes(client, db_session):
    user, headers = await _make_user(db_session)

    resp = await client.get("/api/v1/donors/me/streak", headers=headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["user_id"] == str(user.id)
    assert data["current_streak_months"] == 0
    assert data["tier"] == "none"
    assert data["next_tier"] == "spark"
    assert data["months_to_next_tier"] == 1


@pytest.mark.asyncio
async def test_recompute_endpoint_reflects_donations(client, db_session):
    user, headers = await _make_user(db_session)
    await _insert_donation(db_session, user.id, _utc(2026, 4))
    await _insert_donation(db_session, user.id, _utc(2026, 5))

    resp = await client.post("/api/v1/donors/me/streak/recompute", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["current_streak_months"] == 2
    assert data["tier"] == "spark"

    rewards_resp = await client.get("/api/v1/donors/me/rewards", headers=headers)
    assert rewards_resp.status_code == 200
    tiers = [r["tier_unlocked"] for r in rewards_resp.json()["items"]]
    assert "spark" in tiers


@pytest.mark.asyncio
async def test_leaderboard_requires_admin(client, db_session, auth_user, admin_user):
    forbidden = await client.get(
        "/api/v1/streaks/leaderboard", headers=auth_user["headers"]
    )
    assert forbidden.status_code == 403

    ok = await client.get(
        "/api/v1/streaks/leaderboard?limit=5", headers=admin_user["headers"]
    )
    assert ok.status_code == 200
    body = ok.json()
    assert "items" in body
    assert "total" in body


@pytest.mark.asyncio
async def test_leaderboard_ranks_by_current_streak(client, db_session, admin_user):
    a, _ = await _make_user(db_session)
    b, _ = await _make_user(db_session)
    await _insert_donation(db_session, a.id, _utc(2026, 5))
    await _insert_donation(db_session, b.id, _utc(2026, 3))
    await _insert_donation(db_session, b.id, _utc(2026, 4))
    await _insert_donation(db_session, b.id, _utc(2026, 5))
    await streak_service.recompute(db_session, a.id)
    await streak_service.recompute(db_session, b.id)

    resp = await client.get(
        "/api/v1/streaks/leaderboard?limit=5", headers=admin_user["headers"]
    )
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) >= 2
    assert items[0]["current_streak_months"] >= items[-1]["current_streak_months"]


def test_listener_registers_idempotently():
    from app.streaks.listener import register

    register()
    register()  # second call should be a no-op
