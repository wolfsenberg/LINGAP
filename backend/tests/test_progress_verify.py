"""Tests for progress updates + verifier confirmation endpoints."""
from __future__ import annotations

import io
import uuid

import pytest


@pytest.mark.asyncio
async def test_create_progress_with_proofs(client, auth_user, seed_aid_request):
    files = {"file": ("r.png", io.BytesIO(b"progress-receipt"), "image/png")}
    up = await client.post(
        f"/api/v1/aid-requests/{seed_aid_request.id}/proofs",
        files=files,
        data={"kind": "receipt"},
        headers=auth_user["headers"],
    )
    pid = up.json()["id"]

    resp = await client.post(
        f"/api/v1/aid-requests/{seed_aid_request.id}/progress",
        json={
            "status": "in_progress",
            "note": "Treatment session 1 done",
            "proof_ids": [pid],
        },
        headers=auth_user["headers"],
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["note"] == "Treatment session 1 done"
    assert pid in body["proof_ids"]


@pytest.mark.asyncio
async def test_progress_rejects_foreign_proof(client, auth_user, seed_aid_request):
    foreign = str(uuid.uuid4())
    resp = await client.post(
        f"/api/v1/aid-requests/{seed_aid_request.id}/progress",
        json={"status": "in_progress", "note": "x", "proof_ids": [foreign]},
        headers=auth_user["headers"],
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_verify_requires_aid_worker_or_admin(
    client, auth_user, admin_user, aid_worker_user, seed_aid_request
):
    create = await client.post(
        f"/api/v1/aid-requests/{seed_aid_request.id}/progress",
        json={"status": "in_progress", "note": "Update"},
        headers=auth_user["headers"],
    )
    update_id = create.json()["id"]

    forbidden = await client.post(
        f"/api/v1/progress/{update_id}/verify",
        json={"decision": "confirmed", "notes": "looks ok"},
        headers=auth_user["headers"],
    )
    assert forbidden.status_code == 403

    ok_worker = await client.post(
        f"/api/v1/progress/{update_id}/verify",
        json={"decision": "confirmed", "notes": "looks ok"},
        headers=aid_worker_user["headers"],
    )
    assert ok_worker.status_code == 201

    ok_admin = await client.post(
        f"/api/v1/progress/{update_id}/verify",
        json={"decision": "disputed", "notes": "needs more proof"},
        headers=admin_user["headers"],
    )
    assert ok_admin.status_code == 201

    listed = await client.get(
        f"/api/v1/aid-requests/{seed_aid_request.id}/progress",
        headers=auth_user["headers"],
    )
    assert listed.status_code == 200
    items = listed.json()
    assert len(items) == 1
    assert len(items[0]["confirmations"]) == 2
