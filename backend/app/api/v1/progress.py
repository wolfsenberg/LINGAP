"""Progress updates and verifier confirmations on AidRequests."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, get_db
from app.core.dependencies import get_current_user, require_aid_worker_or_admin
from app.models.aid_request import AidRequest
from app.models.proof_artifact import ProofArtifact
from app.models.progress_update import (
    ProgressUpdate,
    VerifierConfirmation,
)
from app.models.user import User
from app.schemas.progress import (
    ProgressCreate,
    ProgressUpdateRead,
    VerifierConfirmationRead,
    VerifyRequest,
)

progress_router = APIRouter(
    prefix="/aid-requests/{request_id}/progress", tags=["progress"]
)

verify_router = APIRouter(prefix="/progress", tags=["progress"])


async def _credibility_rescan_bg(beneficiary_id: uuid.UUID, reason: str) -> None:
    from app.credibility.service import credibility_service

    async with AsyncSessionLocal() as session:
        try:
            await credibility_service.rescan(session, beneficiary_id, reason=reason)
        except Exception:  # noqa: BLE001
            import logging

            logging.getLogger(__name__).exception(
                "Background credibility rescan failed for %s", beneficiary_id
            )


def _to_read(
    update: ProgressUpdate, confirmations: list[VerifierConfirmation]
) -> ProgressUpdateRead:
    return ProgressUpdateRead(
        id=update.id,
        aid_request_id=update.aid_request_id,
        author_id=update.author_id,
        status=update.status,
        note=update.note,
        proof_ids=[uuid.UUID(str(p)) for p in (update.proof_ids or [])],
        confirmations=[VerifierConfirmationRead.model_validate(c) for c in confirmations],
        created_at=update.created_at,
    )


@progress_router.post("", status_code=201, response_model=ProgressUpdateRead)
async def create_progress(
    request_id: uuid.UUID,
    body: ProgressCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    req = (
        await db.execute(select(AidRequest).where(AidRequest.id == request_id))
    ).scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Aid request not found")

    if body.proof_ids:
        rows = (
            await db.execute(
                select(ProofArtifact.id, ProofArtifact.aid_request_id).where(
                    ProofArtifact.id.in_(body.proof_ids)
                )
            )
        ).all()
        found = {pid: rid for pid, rid in rows}
        missing = [pid for pid in body.proof_ids if pid not in found]
        if missing:
            raise HTTPException(400, f"Unknown proof ids: {missing}")
        foreign = [pid for pid, rid in found.items() if rid != request_id]
        if foreign:
            raise HTTPException(
                400,
                "All proof_ids must belong to the same aid request",
            )

    update = ProgressUpdate(
        aid_request_id=request_id,
        author_id=user.id,
        status=body.status,
        note=body.note,
        proof_ids=[str(p) for p in body.proof_ids],
    )
    db.add(update)
    await db.commit()
    await db.refresh(update)
    return _to_read(update, [])


@progress_router.get("", response_model=list[ProgressUpdateRead])
async def list_progress(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    req = (
        await db.execute(select(AidRequest).where(AidRequest.id == request_id))
    ).scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Aid request not found")

    updates = (
        await db.execute(
            select(ProgressUpdate)
            .where(ProgressUpdate.aid_request_id == request_id)
            .order_by(ProgressUpdate.created_at.desc())
        )
    ).scalars().all()

    results: list[ProgressUpdateRead] = []
    for u in updates:
        confs = (
            await db.execute(
                select(VerifierConfirmation)
                .where(VerifierConfirmation.progress_update_id == u.id)
                .order_by(VerifierConfirmation.created_at.asc())
            )
        ).scalars().all()
        results.append(_to_read(u, list(confs)))
    return results


@verify_router.post(
    "/{progress_id}/verify",
    status_code=201,
    response_model=VerifierConfirmationRead,
)
async def verify_progress(
    progress_id: uuid.UUID,
    body: VerifyRequest,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_aid_worker_or_admin),
):
    update = (
        await db.execute(
            select(ProgressUpdate).where(ProgressUpdate.id == progress_id)
        )
    ).scalar_one_or_none()
    if not update:
        raise HTTPException(404, "Progress update not found")

    confirmation = VerifierConfirmation(
        progress_update_id=update.id,
        verifier_id=user.id,
        decision=body.decision,
        notes=body.notes,
    )
    db.add(confirmation)
    await db.commit()
    await db.refresh(confirmation)

    parent = (
        await db.execute(select(AidRequest).where(AidRequest.id == update.aid_request_id))
    ).scalar_one_or_none()
    if parent is not None:
        background.add_task(
            _credibility_rescan_bg, parent.beneficiary_id, "verifier_confirmed"
        )
    return VerifierConfirmationRead.model_validate(confirmation)
