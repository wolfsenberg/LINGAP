"""Tests for ENFORCE_PROOF_GATE-aware disbursement guard."""
from __future__ import annotations

import io

import pytest
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_disburse_unchanged_when_gate_off(
    client, admin_user, seed_aid_request, db_session, monkeypatch
):
    from app.config import settings
    from app.models.aid_request import AidRequestStatus

    monkeypatch.setattr(settings, "ENFORCE_PROOF_GATE", False)

    seed_aid_request.status = AidRequestStatus.approved
    await db_session.commit()

    with patch(
        "app.api.v1.aid_requests.send_payment",
        new=AsyncMock(return_value="a" * 64),
    ):
        resp = await client.patch(
            f"/api/v1/aid-requests/{seed_aid_request.id}/disburse",
            headers=admin_user["headers"],
        )
    assert resp.status_code == 200, resp.text


@pytest.mark.asyncio
async def test_disburse_blocked_without_proofs(
    client, admin_user, seed_aid_request, db_session, monkeypatch
):
    from app.config import settings
    from app.models.aid_request import AidRequestStatus

    monkeypatch.setattr(settings, "ENFORCE_PROOF_GATE", True)
    monkeypatch.setattr(settings, "MIN_PROOFS_FOR_DISBURSE", 1)

    seed_aid_request.status = AidRequestStatus.approved
    await db_session.commit()

    resp = await client.patch(
        f"/api/v1/aid-requests/{seed_aid_request.id}/disburse",
        headers=admin_user["headers"],
    )
    assert resp.status_code == 400
    assert "proof" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_disburse_blocked_without_verifier_confirmation(
    client, admin_user, auth_user, seed_aid_request, db_session, monkeypatch
):
    from app.config import settings
    from app.models.aid_request import AidRequestStatus

    monkeypatch.setattr(settings, "ENFORCE_PROOF_GATE", True)
    monkeypatch.setattr(settings, "MIN_PROOFS_FOR_DISBURSE", 1)

    files = {"file": ("r.png", io.BytesIO(b"gate-test-receipt"), "image/png")}
    await client.post(
        f"/api/v1/aid-requests/{seed_aid_request.id}/proofs",
        files=files,
        data={"kind": "receipt"},
        headers=auth_user["headers"],
    )

    seed_aid_request.status = AidRequestStatus.approved
    await db_session.commit()

    resp = await client.patch(
        f"/api/v1/aid-requests/{seed_aid_request.id}/disburse",
        headers=admin_user["headers"],
    )
    assert resp.status_code == 400
    assert "verifier" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_disburse_blocked_on_critical_risk_without_override(
    client, admin_user, auth_user, aid_worker_user, seed_aid_request, db_session, monkeypatch
):
    from app.config import settings
    from app.models.aid_request import AidRequestStatus, RiskLevel

    monkeypatch.setattr(settings, "ENFORCE_PROOF_GATE", True)
    monkeypatch.setattr(settings, "MIN_PROOFS_FOR_DISBURSE", 1)

    files = {"file": ("r.png", io.BytesIO(b"crit-receipt"), "image/png")}
    await client.post(
        f"/api/v1/aid-requests/{seed_aid_request.id}/proofs",
        files=files,
        data={"kind": "receipt"},
        headers=auth_user["headers"],
    )
    progress = await client.post(
        f"/api/v1/aid-requests/{seed_aid_request.id}/progress",
        json={"status": "delivered", "note": "Treatment complete"},
        headers=auth_user["headers"],
    )
    await client.post(
        f"/api/v1/progress/{progress.json()['id']}/verify",
        json={"decision": "confirmed"},
        headers=aid_worker_user["headers"],
    )

    seed_aid_request.status = AidRequestStatus.approved
    seed_aid_request.cached_risk_level = RiskLevel.critical
    await db_session.commit()

    blocked = await client.patch(
        f"/api/v1/aid-requests/{seed_aid_request.id}/disburse",
        headers=admin_user["headers"],
    )
    assert blocked.status_code == 400
    assert "critical" in blocked.json()["detail"].lower()

    with patch(
        "app.api.v1.aid_requests.send_payment",
        new=AsyncMock(return_value="b" * 64),
    ):
        ok = await client.patch(
            f"/api/v1/aid-requests/{seed_aid_request.id}/disburse?override=true",
            headers=admin_user["headers"],
        )
    assert ok.status_code == 200, ok.text
