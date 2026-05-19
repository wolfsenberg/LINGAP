"""Tests for spending comparison math."""
from __future__ import annotations

import io

import pytest


@pytest.mark.asyncio
async def test_spending_zero_when_no_claims(client, auth_user, seed_aid_request):
    resp = await client.get(
        f"/api/v1/aid-requests/{seed_aid_request.id}/spending",
        headers=auth_user["headers"],
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["claimed_total"] == 0.0
    assert body["requested_amount"] == 1000.0
    assert body["variance_pct"] == 100.0
    assert body["breakdown"] == {}


@pytest.mark.asyncio
async def test_spending_aggregates_by_kind(client, auth_user, seed_aid_request):
    files = {"file": ("r1.png", io.BytesIO(b"sp-receipt-1"), "image/png")}
    await client.post(
        f"/api/v1/aid-requests/{seed_aid_request.id}/proofs",
        files=files,
        data={"kind": "receipt", "claimed_amount": "300"},
        headers=auth_user["headers"],
    )
    files = {"file": ("i1.pdf", io.BytesIO(b"sp-invoice-1"), "application/pdf")}
    await client.post(
        f"/api/v1/aid-requests/{seed_aid_request.id}/proofs",
        files=files,
        data={"kind": "invoice", "claimed_amount": "450"},
        headers=auth_user["headers"],
    )

    resp = await client.get(
        f"/api/v1/aid-requests/{seed_aid_request.id}/spending?refresh=true",
        headers=auth_user["headers"],
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["claimed_total"] == 750.0
    assert body["breakdown"]["receipt"] == 300.0
    assert body["breakdown"]["invoice"] == 450.0
    # variance = |1000 - 750| / 1000 * 100 = 25.0
    assert abs(body["variance_pct"] - 25.0) < 0.001
