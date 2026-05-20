"""Tests for the beneficiary credibility engine, service, and endpoints."""
from __future__ import annotations

import uuid

import pytest

from app.credibility.engine import (
    CredibilityFeatures,
    CredibilityTier,
    compute,
    score_to_tier,
)
from app.credibility.service import credibility_service


def _features(**overrides) -> CredibilityFeatures:
    base = dict(
        beneficiary_id=str(uuid.uuid4()),
        kyc_verified=False,
        aid_request_count=0,
        proof_count=0,
        disbursed_count=0,
        rejected_count=0,
        confirmed_verifications=0,
        disputed_verifications=0,
        avg_recent_risk_score=None,
        open_scam_flags=0,
        account_age_months=0.0,
    )
    base.update(overrides)
    return CredibilityFeatures(**base)


def test_engine_new_beneficiary_low_score():
    result = compute(_features())
    assert result.tier == CredibilityTier.new
    assert 0 <= result.score <= 20


def test_engine_trusted_beneficiary():
    result = compute(
        _features(
            kyc_verified=True,
            aid_request_count=3,
            proof_count=6,
            disbursed_count=3,
            confirmed_verifications=5,
            disputed_verifications=0,
            avg_recent_risk_score=20.0,
            account_age_months=12.0,
        )
    )
    assert result.score >= 70, result.to_breakdown()
    assert result.tier in (CredibilityTier.trusted, CredibilityTier.verified_partner)


def test_engine_open_scam_flag_penalizes():
    base = _features(
        kyc_verified=True,
        aid_request_count=3,
        proof_count=6,
        disbursed_count=3,
        confirmed_verifications=5,
        avg_recent_risk_score=20.0,
        account_age_months=12.0,
    )
    clean = compute(base)
    flagged = compute(_features(**{**base.__dict__, "open_scam_flags": 2}))
    assert flagged.score < clean.score
    # Two flags = -20 raw, but score cap may dampen; verify at least a meaningful gap.
    assert clean.score - flagged.score >= 15


def test_engine_disputed_verifications_reduce_score():
    confirmed_only = compute(
        _features(
            kyc_verified=True,
            aid_request_count=2,
            confirmed_verifications=4,
            disputed_verifications=0,
        )
    )
    mostly_disputed = compute(
        _features(
            kyc_verified=True,
            aid_request_count=2,
            confirmed_verifications=1,
            disputed_verifications=3,
        )
    )
    assert mostly_disputed.score < confirmed_only.score


def test_score_to_tier_boundaries():
    assert score_to_tier(0) == CredibilityTier.new
    assert score_to_tier(34.9) == CredibilityTier.new
    assert score_to_tier(35.0) == CredibilityTier.building
    assert score_to_tier(65.0) == CredibilityTier.trusted
    assert score_to_tier(85.0) == CredibilityTier.verified_partner
    assert score_to_tier(100.0) == CredibilityTier.verified_partner


def test_features_stable_hash_idempotent():
    bid = str(uuid.uuid4())
    f1 = _features(beneficiary_id=bid, kyc_verified=True, aid_request_count=3)
    f2 = _features(beneficiary_id=bid, kyc_verified=True, aid_request_count=3)
    assert f1.stable_hash() == f2.stable_hash()

    f3 = _features(beneficiary_id=bid, kyc_verified=True, aid_request_count=4)
    assert f1.stable_hash() != f3.stable_hash()


@pytest.mark.asyncio
async def test_service_persists_snapshot_and_caches(db_session):
    from app.models.beneficiary import Beneficiary, BeneficiaryCategory, NeedLevel
    from app.models.credibility import CredibilityAssessment
    from sqlalchemy import select

    b = Beneficiary(
        id=uuid.uuid4(),
        name="Anna",
        national_id=f"NID-{uuid.uuid4().hex[:8]}",
        location="Manila",
        category=BeneficiaryCategory.individual,
        need_level=NeedLevel.medium,
        verified=True,
        total_received=0,
    )
    db_session.add(b)
    await db_session.commit()

    snap = await credibility_service.assess(db_session, b.id)
    assert snap is not None
    assert snap.score >= 0

    await db_session.refresh(b)
    assert b.cached_credibility_score is not None
    assert b.cached_credibility_tier is not None
    assert b.credibility_recomputed_at is not None

    snapshots = (
        await db_session.execute(
            select(CredibilityAssessment).where(CredibilityAssessment.beneficiary_id == b.id)
        )
    ).scalars().all()
    assert len(snapshots) == 1


@pytest.mark.asyncio
async def test_service_idempotent_via_inputs_hash(db_session):
    from app.models.beneficiary import Beneficiary, BeneficiaryCategory, NeedLevel
    from app.models.credibility import CredibilityAssessment
    from sqlalchemy import select

    b = Beneficiary(
        id=uuid.uuid4(),
        name="Anna",
        national_id=f"NID-{uuid.uuid4().hex[:8]}",
        location="Manila",
        category=BeneficiaryCategory.individual,
        need_level=NeedLevel.medium,
        verified=True,
        total_received=0,
    )
    db_session.add(b)
    await db_session.commit()

    first = await credibility_service.assess(db_session, b.id)
    second = await credibility_service.assess(db_session, b.id)
    assert first.id == second.id

    forced = await credibility_service.assess(db_session, b.id, force=True)
    assert forced.id != first.id

    snapshots = (
        await db_session.execute(
            select(CredibilityAssessment).where(CredibilityAssessment.beneficiary_id == b.id)
        )
    ).scalars().all()
    assert len(snapshots) == 2


@pytest.mark.asyncio
async def test_get_credibility_lazy_initializes(client, db_session, auth_user):
    from app.models.beneficiary import Beneficiary, BeneficiaryCategory, NeedLevel

    b = Beneficiary(
        id=uuid.uuid4(),
        name="Pedro",
        national_id=f"NID-{uuid.uuid4().hex[:8]}",
        location="Cebu",
        category=BeneficiaryCategory.individual,
        need_level=NeedLevel.medium,
        verified=False,
        total_received=0,
    )
    db_session.add(b)
    await db_session.commit()

    resp = await client.get(
        f"/api/v1/beneficiaries/{b.id}/credibility",
        headers=auth_user["headers"],
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["beneficiary_id"] == str(b.id)
    assert data["tier"] is not None
    assert data["score"] is not None
    assert "signals" in data["breakdown"]


@pytest.mark.asyncio
async def test_recompute_requires_aid_worker_or_admin(client, db_session, auth_user, aid_worker_user):
    from app.models.beneficiary import Beneficiary, BeneficiaryCategory, NeedLevel

    b = Beneficiary(
        id=uuid.uuid4(),
        name="Pedro",
        national_id=f"NID-{uuid.uuid4().hex[:8]}",
        location="Cebu",
        category=BeneficiaryCategory.individual,
        need_level=NeedLevel.medium,
        verified=True,
        total_received=0,
    )
    db_session.add(b)
    await db_session.commit()

    forbidden = await client.post(
        f"/api/v1/beneficiaries/{b.id}/credibility/recompute",
        headers=auth_user["headers"],
    )
    assert forbidden.status_code == 403

    ok = await client.post(
        f"/api/v1/beneficiaries/{b.id}/credibility/recompute",
        headers=aid_worker_user["headers"],
    )
    assert ok.status_code == 200, ok.text
    payload = ok.json()
    assert payload["beneficiary_id"] == str(b.id)
    assert payload["engine_version"] == "v1"


@pytest.mark.asyncio
async def test_credibility_history(client, db_session, aid_worker_user):
    from app.models.beneficiary import Beneficiary, BeneficiaryCategory, NeedLevel

    b = Beneficiary(
        id=uuid.uuid4(),
        name="Pedro",
        national_id=f"NID-{uuid.uuid4().hex[:8]}",
        location="Cebu",
        category=BeneficiaryCategory.individual,
        need_level=NeedLevel.medium,
        verified=True,
        total_received=0,
    )
    db_session.add(b)
    await db_session.commit()

    await client.post(
        f"/api/v1/beneficiaries/{b.id}/credibility/recompute",
        headers=aid_worker_user["headers"],
    )
    await client.post(
        f"/api/v1/beneficiaries/{b.id}/credibility/recompute",
        headers=aid_worker_user["headers"],
    )

    history = await client.get(
        f"/api/v1/beneficiaries/{b.id}/credibility/history?limit=10",
        headers=aid_worker_user["headers"],
    )
    assert history.status_code == 200
    data = history.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2
    assert data["items"][0]["created_at"] >= data["items"][-1]["created_at"]


@pytest.mark.asyncio
async def test_credibility_404_unknown_beneficiary(client, auth_user):
    resp = await client.get(
        f"/api/v1/beneficiaries/{uuid.uuid4()}/credibility",
        headers=auth_user["headers"],
    )
    assert resp.status_code == 404
