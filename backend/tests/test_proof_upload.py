"""Tests for /aid-requests/{id}/proofs endpoints."""
from __future__ import annotations

import io

import pytest


@pytest.mark.asyncio
async def test_upload_proof_happy_path(client, auth_user, seed_aid_request, db_session):
    req = seed_aid_request
    files = {"file": ("receipt.png", io.BytesIO(b"PNG-BYTES-HERE-123"), "image/png")}
    data = {"kind": "receipt", "claimed_amount": "250.5", "description": "Pharmacy"}
    resp = await client.post(
        f"/api/v1/aid-requests/{req.id}/proofs",
        files=files,
        data=data,
        headers=auth_user["headers"],
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["sha256"]
    assert body["mime"] == "image/png"
    assert body["kind"] == "receipt"
    assert body["claimed_amount"] == 250.5
    assert body["download_url"].endswith("/download")

    await db_session.refresh(req)
    assert req.proof_count == 1


@pytest.mark.asyncio
async def test_upload_proof_rejects_unsupported_mime(client, auth_user, seed_aid_request):
    files = {"file": ("evil.exe", io.BytesIO(b"MZ"), "application/x-msdownload")}
    resp = await client.post(
        f"/api/v1/aid-requests/{seed_aid_request.id}/proofs",
        files=files,
        data={"kind": "receipt"},
        headers=auth_user["headers"],
    )
    assert resp.status_code == 415


@pytest.mark.asyncio
async def test_upload_proof_dedupe_same_sha(client, auth_user, seed_aid_request):
    payload = b"identical-bytes-for-sha-dedupe"
    files1 = {"file": ("a.png", io.BytesIO(payload), "image/png")}
    r1 = await client.post(
        f"/api/v1/aid-requests/{seed_aid_request.id}/proofs",
        files=files1,
        data={"kind": "receipt"},
        headers=auth_user["headers"],
    )
    assert r1.status_code == 201

    files2 = {"file": ("b.png", io.BytesIO(payload), "image/png")}
    r2 = await client.post(
        f"/api/v1/aid-requests/{seed_aid_request.id}/proofs",
        files=files2,
        data={"kind": "receipt"},
        headers=auth_user["headers"],
    )
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_upload_proof_size_limit(client, auth_user, seed_aid_request, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "MAX_UPLOAD_MB", 0)  # zero MB = always too large
    files = {"file": ("big.png", io.BytesIO(b"AAAAA" * 1024), "image/png")}
    resp = await client.post(
        f"/api/v1/aid-requests/{seed_aid_request.id}/proofs",
        files=files,
        data={"kind": "receipt"},
        headers=auth_user["headers"],
    )
    assert resp.status_code == 413


@pytest.mark.asyncio
async def test_list_proofs_excludes_deleted(client, auth_user, seed_aid_request):
    files = {"file": ("r.png", io.BytesIO(b"abc-soft-delete"), "image/png")}
    up = await client.post(
        f"/api/v1/aid-requests/{seed_aid_request.id}/proofs",
        files=files,
        data={"kind": "receipt"},
        headers=auth_user["headers"],
    )
    pid = up.json()["id"]

    rd = await client.delete(
        f"/api/v1/aid-requests/{seed_aid_request.id}/proofs/{pid}",
        headers=auth_user["headers"],
    )
    assert rd.status_code == 204

    listed = await client.get(
        f"/api/v1/aid-requests/{seed_aid_request.id}/proofs",
        headers=auth_user["headers"],
    )
    assert listed.status_code == 200
    assert listed.json()["items"] == []

    with_deleted = await client.get(
        f"/api/v1/aid-requests/{seed_aid_request.id}/proofs?include_deleted=true",
        headers=auth_user["headers"],
    )
    assert len(with_deleted.json()["items"]) == 1


@pytest.mark.asyncio
async def test_upload_proof_status_gate(client, auth_user, seed_aid_request, db_session):
    from app.models.aid_request import AidRequestStatus

    seed_aid_request.status = AidRequestStatus.disbursed
    await db_session.commit()

    files = {"file": ("r.png", io.BytesIO(b"after-disburse"), "image/png")}
    resp = await client.post(
        f"/api/v1/aid-requests/{seed_aid_request.id}/proofs",
        files=files,
        data={"kind": "receipt"},
        headers=auth_user["headers"],
    )
    assert resp.status_code == 400
