"""Integration tests for RiskService + /risk endpoints."""
from __future__ import annotations

import io
from unittest.mock import AsyncMock, patch

import pytest

from app.ai.base import RiskFlag, RiskResult
from app.ai.service import risk_service
from app.models.aid_request import RiskLevel


@pytest.mark.asyncio
async def test_assess_persists_risk_and_caches(db_session, seed_aid_request):
    fake = RiskResult(
        score=72.0,
        level=RiskLevel.high,
        flags=[RiskFlag(type="vague_purpose", severity="high", reason="x")],
        reasoning="test",
        model_version="test-v0",
    )
    with patch("app.ai.service._pick_engine") as pick:
        engine = AsyncMock()
        engine.name = "rules"
        engine.assess = AsyncMock(return_value=fake)
        pick.return_value = engine

        a = await risk_service.assess(db_session, seed_aid_request.id, force=True)

    assert a is not None
    assert float(a.score) == 72.0
    assert a.level == RiskLevel.high
    assert any(f["type"] == "vague_purpose" for f in a.flags)
    assert a.inputs_hash

    await db_session.refresh(seed_aid_request)
    assert float(seed_aid_request.cached_risk_score) == 72.0
    assert seed_aid_request.cached_risk_level == RiskLevel.high


@pytest.mark.asyncio
async def test_assess_is_idempotent_on_inputs_hash(db_session, seed_aid_request):
    fake = RiskResult(
        score=10.0,
        level=RiskLevel.low,
        flags=[],
        reasoning="r",
        model_version="test-v0",
    )
    with patch("app.ai.service._pick_engine") as pick:
        engine = AsyncMock()
        engine.name = "rules"
        engine.assess = AsyncMock(return_value=fake)
        pick.return_value = engine

        a = await risk_service.assess(db_session, seed_aid_request.id, force=True)
        b = await risk_service.assess(db_session, seed_aid_request.id, force=False)

    assert a.id == b.id, "second call should reuse the same row when inputs_hash matches"


@pytest.mark.asyncio
async def test_scan_endpoint_creates_flags_and_spending(
    client, auth_user, aid_worker_user, seed_aid_request
):
    files = {"file": ("r.png", io.BytesIO(b"risk-receipt"), "image/png")}
    await client.post(
        f"/api/v1/aid-requests/{seed_aid_request.id}/proofs",
        files=files,
        data={"kind": "receipt", "claimed_amount": "100"},
        headers=auth_user["headers"],
    )

    fake = RiskResult(
        score=85.0,
        level=RiskLevel.critical,
        flags=[
            RiskFlag(type="spending_variance", severity="critical", reason="huge gap"),
            RiskFlag(type="vague_purpose", severity="low", reason="tiny"),
        ],
        reasoning="mocked",
        model_version="test-v0",
    )
    with patch("app.ai.service._pick_engine") as pick:
        engine = AsyncMock()
        engine.name = "rules"
        engine.assess = AsyncMock(return_value=fake)
        pick.return_value = engine

        resp = await client.post(
            f"/api/v1/aid-requests/{seed_aid_request.id}/risk/scan",
            headers=aid_worker_user["headers"],
        )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["level"] == "critical"

    spending = await client.get(
        f"/api/v1/aid-requests/{seed_aid_request.id}/spending",
        headers=aid_worker_user["headers"],
    )
    assert spending.status_code == 200
    sp = spending.json()
    assert sp["claimed_total"] == 100.0
    assert sp["requested_amount"] == 1000.0


@pytest.mark.asyncio
async def test_flag_queue_and_patch(
    client, admin_user, aid_worker_user, seed_aid_request
):
    fake = RiskResult(
        score=70.0,
        level=RiskLevel.high,
        flags=[RiskFlag(type="suspicious", severity="high", reason="r")],
        reasoning="m",
        model_version="t",
    )
    with patch("app.ai.service._pick_engine") as pick:
        engine = AsyncMock()
        engine.name = "rules"
        engine.assess = AsyncMock(return_value=fake)
        pick.return_value = engine

        await client.post(
            f"/api/v1/aid-requests/{seed_aid_request.id}/risk/scan",
            headers=aid_worker_user["headers"],
        )

    listed = await client.get(
        "/api/v1/risk/flags?status=open",
        headers=admin_user["headers"],
    )
    assert listed.status_code == 200
    items = listed.json()["items"]
    assert any(it["flag_type"] == "suspicious" for it in items)

    flag_id = items[0]["id"]
    patched = await client.patch(
        f"/api/v1/risk/flags/{flag_id}",
        json={"status": "dismissed", "resolution_note": "looks ok"},
        headers=admin_user["headers"],
    )
    assert patched.status_code == 200
    assert patched.json()["status"] == "dismissed"
    assert patched.json()["resolution_note"] == "looks ok"


@pytest.mark.asyncio
async def test_flag_queue_requires_admin(client, aid_worker_user):
    forbidden = await client.get(
        "/api/v1/risk/flags",
        headers=aid_worker_user["headers"],
    )
    assert forbidden.status_code == 403
