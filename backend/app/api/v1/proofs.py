"""Proof of Reality endpoints — receipts/documents attached to AidRequest."""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.aid_request import AidRequest, AidRequestStatus
from app.models.proof_artifact import ProofArtifact, ProofKind
from app.models.user import User
from app.schemas.proof import ProofArtifactList, ProofArtifactRead
from app.storage.local import open_stream, save_upload


async def _rescan_in_background(aid_request_id: uuid.UUID, reason: str) -> None:
    """Open a fresh DB session and trigger a risk rescan."""
    from app.ai.service import risk_service

    async with AsyncSessionLocal() as session:
        try:
            await risk_service.rescan(session, aid_request_id, reason=reason)
        except Exception:  # noqa: BLE001 — never fail an upload because of risk
            import logging

            logging.getLogger(__name__).exception(
                "Background risk rescan failed for %s", aid_request_id
            )

router = APIRouter(prefix="/aid-requests/{request_id}/proofs", tags=["proofs"])


DELETE_GRACE_WINDOW = timedelta(hours=1)


def _to_read(p: ProofArtifact) -> ProofArtifactRead:
    data = ProofArtifactRead.model_validate(p).model_dump()
    data["download_url"] = (
        f"/api/v1/aid-requests/{p.aid_request_id}/proofs/{p.id}/download"
    )
    return ProofArtifactRead(**data)


async def _get_aid_request(db: AsyncSession, request_id: uuid.UUID) -> AidRequest:
    req = (
        await db.execute(select(AidRequest).where(AidRequest.id == request_id))
    ).scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Aid request not found")
    return req


@router.post("", status_code=201, response_model=ProofArtifactRead)
async def upload_proof(
    request_id: uuid.UUID,
    background: BackgroundTasks,
    file: UploadFile = File(...),
    kind: ProofKind = Form(ProofKind.receipt),
    claimed_amount: float | None = Form(None),
    description: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    req = await _get_aid_request(db, request_id)
    if req.status not in (AidRequestStatus.pending, AidRequestStatus.approved):
        raise HTTPException(
            400,
            "Proofs may only be uploaded while the request is pending or approved",
        )

    stored = await save_upload(file, request_id)

    existing = (
        await db.execute(
            select(ProofArtifact).where(
                ProofArtifact.aid_request_id == request_id,
                ProofArtifact.sha256 == stored.sha256,
                ProofArtifact.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            409,
            "Identical file already uploaded for this request",
        )

    artifact = ProofArtifact(
        aid_request_id=request_id,
        uploader_id=user.id,
        kind=kind,
        filename=stored.filename,
        stored_path=stored.stored_path,
        mime=stored.mime,
        size_bytes=stored.size_bytes,
        sha256=stored.sha256,
        claimed_amount=claimed_amount,
        description=description,
    )
    db.add(artifact)
    req.proof_count = (req.proof_count or 0) + 1
    await db.commit()
    await db.refresh(artifact)

    background.add_task(_rescan_in_background, request_id, "proof_uploaded")
    return _to_read(artifact)


@router.get("", response_model=ProofArtifactList)
async def list_proofs(
    request_id: uuid.UUID,
    include_deleted: bool = False,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    await _get_aid_request(db, request_id)
    q = select(ProofArtifact).where(ProofArtifact.aid_request_id == request_id)
    if not include_deleted:
        q = q.where(ProofArtifact.deleted_at.is_(None))
    q = q.order_by(ProofArtifact.created_at.desc())

    items = (await db.execute(q)).scalars().all()
    total = (
        await db.execute(
            select(func.count())
            .select_from(ProofArtifact)
            .where(ProofArtifact.aid_request_id == request_id)
        )
    ).scalar() or 0
    return ProofArtifactList(items=[_to_read(p) for p in items], total=total)


@router.get("/{proof_id}/download")
async def download_proof(
    request_id: uuid.UUID,
    proof_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    proof = (
        await db.execute(
            select(ProofArtifact).where(
                ProofArtifact.id == proof_id,
                ProofArtifact.aid_request_id == request_id,
            )
        )
    ).scalar_one_or_none()
    if not proof or proof.deleted_at is not None:
        raise HTTPException(404, "Proof not found")
    if not os.path.exists(proof.stored_path):
        raise HTTPException(410, "Proof file is no longer available on disk")

    fp = open_stream(proof.stored_path)
    headers = {
        "Content-Disposition": f'attachment; filename="{proof.filename}"',
        "Content-Length": str(proof.size_bytes),
    }
    return StreamingResponse(fp, media_type=proof.mime, headers=headers)


@router.delete("/{proof_id}", status_code=204)
async def delete_proof(
    request_id: uuid.UUID,
    proof_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    proof = (
        await db.execute(
            select(ProofArtifact).where(
                ProofArtifact.id == proof_id,
                ProofArtifact.aid_request_id == request_id,
            )
        )
    ).scalar_one_or_none()
    if not proof or proof.deleted_at is not None:
        raise HTTPException(404, "Proof not found")

    is_admin = user.role.value == "admin" if hasattr(user.role, "value") else user.role == "admin"
    created_at = proof.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    within_window = (datetime.now(timezone.utc) - created_at) <= DELETE_GRACE_WINDOW
    is_uploader = proof.uploader_id == user.id
    if not (is_admin or (is_uploader and within_window)):
        raise HTTPException(
            403,
            "Only the uploader (within 1 hour) or an admin may delete a proof",
        )

    proof.deleted_at = datetime.now(timezone.utc)
    req = await _get_aid_request(db, request_id)
    req.proof_count = max(0, (req.proof_count or 0) - 1)
    await db.commit()
    return None


# Admin-only convenience: anchor a proof's sha256 on-chain reference
@router.patch("/{proof_id}/anchor", response_model=ProofArtifactRead)
async def anchor_proof(
    request_id: uuid.UUID,
    proof_id: uuid.UUID,
    stellar_anchor_tx: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    proof = (
        await db.execute(
            select(ProofArtifact).where(
                ProofArtifact.id == proof_id,
                ProofArtifact.aid_request_id == request_id,
            )
        )
    ).scalar_one_or_none()
    if not proof:
        raise HTTPException(404, "Proof not found")
    proof.stellar_anchor_tx = stellar_anchor_tx
    await db.commit()
    await db.refresh(proof)
    return _to_read(proof)
