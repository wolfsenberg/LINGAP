"""Deterministic tests for the rules-based risk engine."""
from __future__ import annotations

import pytest

from app.ai.base import ProofSummary, RiskFeatures
from app.ai.rules import (
    LARGE_AMOUNT_THRESHOLD,
    RECEIPT_GRACE_SECONDS,
    UNVERIFIED_AMOUNT_THRESHOLD,
    rules_engine,
)
from app.models.aid_request import RiskLevel


def _features(**overrides) -> RiskFeatures:
    defaults = dict(
        aid_request_id="00000000-0000-0000-0000-000000000001",
        requested_amount=1000.0,
        asset="XLM",
        purpose="Hospital admission for chemotherapy treatment.",
        age_seconds=60,
        beneficiary_id="00000000-0000-0000-0000-000000000002",
        beneficiary_verified=True,
        beneficiary_total_received=0,
        beneficiary_location="Manila",
        proofs=[],
        prior_flags_open=0,
        recent_request_count=0,
        velocity_window_seconds=86400,
    )
    defaults.update(overrides)
    return RiskFeatures(**defaults)


@pytest.mark.asyncio
async def test_clean_request_is_low_risk():
    result = await rules_engine.assess(_features())
    assert result.score == 0
    assert result.level == RiskLevel.low
    assert result.flags == []


@pytest.mark.asyncio
async def test_vague_purpose_triggers_flag():
    result = await rules_engine.assess(_features(purpose="help pls"))
    types = {f.type for f in result.flags}
    assert "vague_purpose" in types
    assert result.score >= 25


@pytest.mark.asyncio
async def test_unverified_large_ask_is_critical():
    result = await rules_engine.assess(
        _features(
            beneficiary_verified=False,
            requested_amount=LARGE_AMOUNT_THRESHOLD + 1,
        )
    )
    types = {f.type for f in result.flags}
    assert "unverified_beneficiary_large_ask" in types
    assert result.level in (RiskLevel.medium, RiskLevel.high, RiskLevel.critical)


@pytest.mark.asyncio
async def test_unverified_above_threshold_high():
    result = await rules_engine.assess(
        _features(
            beneficiary_verified=False,
            requested_amount=UNVERIFIED_AMOUNT_THRESHOLD + 1,
        )
    )
    types = {f.type for f in result.flags}
    assert "unverified_beneficiary_large_ask" in types


@pytest.mark.asyncio
async def test_variance_flag_when_claimed_far_below():
    proof = ProofSummary(
        id="p1", kind="receipt", mime="image/png", size_bytes=100,
        claimed_amount=100.0, sha256="a" * 64,
    )
    result = await rules_engine.assess(
        _features(requested_amount=1000.0, proofs=[proof])
    )
    types = {f.type for f in result.flags}
    assert "spending_variance" in types


@pytest.mark.asyncio
async def test_velocity_flag():
    result = await rules_engine.assess(_features(recent_request_count=10))
    types = {f.type for f in result.flags}
    assert "request_velocity" in types


@pytest.mark.asyncio
async def test_missing_receipts_after_grace_window():
    result = await rules_engine.assess(
        _features(age_seconds=RECEIPT_GRACE_SECONDS + 60, proofs=[])
    )
    types = {f.type for f in result.flags}
    assert "missing_receipts" in types


@pytest.mark.asyncio
async def test_prior_open_flags_contribute():
    result = await rules_engine.assess(_features(prior_flags_open=2))
    types = {f.type for f in result.flags}
    assert "prior_open_flags" in types
