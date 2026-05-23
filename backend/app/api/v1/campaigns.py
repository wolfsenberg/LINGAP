import hashlib
import os
import uuid
from datetime import datetime, timezone
from uuid import UUID

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.aid_request import AidRequest
from app.models.campaign_drive import CampaignDrive, CampaignDriveStatus
from app.models.campaign_drive_change import CampaignDriveChange
from app.models.donation import Donation
from app.models.proof_artifact import ProofArtifact
from app.models.user import User
from app.schemas.campaign_drive import CampaignDriveCreate, CampaignDriveUpdate, CampaignReleaseRequestCreate

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

STATIC_ORGANIZER_EMAIL = "geineldungao012@gmail.com"
DEMO_XLM_TO_PHP = settings.XLM_TO_PHP_RATE
CAMPAIGN_UPLOAD_DIR = os.path.join(os.path.dirname(settings.UPLOAD_DIR), "campaigns")
CAMPAIGN_IMAGE_MIME = {"image/png", "image/jpeg", "image/webp"}
CAMPAIGN_IMAGE_EXT = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
}

STATIC_CAMPAIGNS = [
    {
        "id": "kuya-gino-home-repair",
        "title": "Help Kuya Gino Make His Home Safe",
        "description": "Taho vendor Kuya Gino needs safe doors, windows, and fixtures for his family home.",
        "category": "Community",
        "status": "Active",
        "raised_amount": 0.0,
        "goal_amount": 15000.0,
        "donors": 0,
        "institution": "BayanihanPH",
        "location": "Manila, Metro Manila, Philippines",
        "image_src": "/images/help_kuya_gino.png",
    },
    {
        "id": "rescue-cats-shelter",
        "title": "Help Build a Safe Shelter for 39 Rescue Cats",
        "description": "A student rescuer is building a safer shelter and care system for 39 rescued cats.",
        "category": "Animal Rescue",
        "status": "Active",
        "raised_amount": 0.0,
        "goal_amount": 900000.0,
        "donors": 0,
        "institution": "GoFundMe Campaign",
        "location": "Philippines",
        "image_src": "/images/help_build_a_safe_shelter.png",
    },
    {
        "id": "bulacan-dog-cat-rescue",
        "title": "Rescue and Care for Abandoned Dogs and Cats in Bulacan",
        "description": "A Bulacan rescue drive covering vet fees, food, and shelter for abandoned animals.",
        "category": "Animal Rescue",
        "status": "Active",
        "raised_amount": 0.0,
        "goal_amount": 51300.0,
        "donors": 0,
        "institution": "GoFundMe Campaign",
        "location": "Pulilan, Bulacan, Philippines",
        "image_src": "/images/rescue_and_care.png",
    },
]


def _progress(raised: float, goal: float) -> int:
    if goal <= 0:
        return 0
    return min(100, round((raised / goal) * 100))


async def _save_campaign_cover(upload: UploadFile, user: User) -> str:
    mime = (upload.content_type or "").lower()
    if mime not in CAMPAIGN_IMAGE_MIME:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Campaign cover must be a PNG, JPG, or WebP image.",
        )

    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    os.makedirs(CAMPAIGN_UPLOAD_DIR, exist_ok=True)

    hasher = hashlib.sha256()
    total = 0
    temp_name = f".tmp-{uuid.uuid4().hex}"
    temp_path = os.path.join(CAMPAIGN_UPLOAD_DIR, temp_name)

    try:
        async with aiofiles.open(temp_path, "wb") as out:
            while True:
                chunk = await upload.read(1024 * 64)
                if not chunk:
                    break
                total += len(chunk)
                if total > max_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"Campaign cover exceeds {settings.MAX_UPLOAD_MB} MB.",
                    )
                hasher.update(chunk)
                await out.write(chunk)
    except Exception:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass
        raise

    digest = hasher.hexdigest()
    ext = CAMPAIGN_IMAGE_EXT[mime]
    final_name = f"{user.id}-{digest[:16]}{ext}"
    final_path = os.path.join(CAMPAIGN_UPLOAD_DIR, final_name)

    if os.path.exists(final_path):
        os.remove(temp_path)
    else:
        os.replace(temp_path, final_path)

    return f"/api/v1/campaigns/uploads/{final_name}"


async def _donation_totals(db: AsyncSession, campaign_id: str) -> tuple[float, int]:
    row = (
        await db.execute(
            select(
                func.coalesce(func.sum(Donation.amount), 0).label("total"),
                func.count(distinct(Donation.donor_id)).label("donors"),
            ).where(
                Donation.purpose == f"campaign:{campaign_id}",
            )
        )
    ).one()
    return float(row.total or 0), int(row.donors or 0)


def _format_php(amount: float) -> str:
    return f"₱{amount:,.2f}"


def _serialize_public_campaign(
    *,
    campaign_id: str,
    title: str,
    description: str,
    category: str,
    status: str,
    raised: float,
    goal: float,
    donors: int,
    institution: str,
    location: str,
    image_src: str | None,
    updated_at: datetime,
    source: str,
    organizer_id: UUID | None = None,
    organizer_name: str | None = None,
    soroban_campaign_id: int | None = None,
) -> dict:
    return {
        "id": campaign_id,
        "slug": campaign_id,
        "organizer_id": organizer_id,
        "organizer_name": organizer_name,
        "title": title,
        "description": description,
        "category": category,
        "status": status,
        "raised_amount": raised,
        "goal_amount": goal,
        "raised_label": _format_php(raised),
        "goal_label": _format_php(goal),
        "progress": _progress(raised, goal),
        "donors": donors,
        "institution": institution,
        "location": location,
        "image_src": image_src,
        "soroban_campaign_id": soroban_campaign_id,
        "updated_at": updated_at,
        "source": source,
    }


async def _serialize_drive(db: AsyncSession, drive: CampaignDrive) -> dict:
    donated_xlm, donor_count = await _donation_totals(db, str(drive.id))
    raised = float(drive.raised_amount) + donated_xlm * DEMO_XLM_TO_PHP
    goal = float(drive.goal_amount)
    return _serialize_public_campaign(
        campaign_id=str(drive.id),
        organizer_id=drive.organizer_id,
        organizer_name=None,
        title=drive.title,
        description=drive.description,
        category=drive.category,
        status=drive.status.value,
        raised=raised,
        goal=goal,
        donors=drive.donors + donor_count,
        institution=drive.institution,
        location=drive.location,
        image_src=drive.image_src,
        updated_at=drive.updated_at,
        source="database",
    )


def _summarize_changes(changed_fields: list[str]) -> str:
    labels = {
        "title": "title",
        "description": "story",
        "category": "category",
        "institution": "institution",
        "location": "location",
        "goal_amount": "target amount",
        "image_src": "cover image",
    }
    readable = [labels.get(field, field) for field in changed_fields]
    if not readable:
        return "No visible campaign details changed."
    if len(readable) == 1:
        return f"Updated campaign {readable[0]}."
    return f"Updated campaign {', '.join(readable[:-1])}, and {readable[-1]}."


def _change_log_payload(change: CampaignDriveChange, campaign: CampaignDrive, actor: User) -> dict:
    return {
        "id": str(change.id),
        "campaign_id": str(change.campaign_id),
        "campaign_title": campaign.title,
        "actor_id": str(change.actor_id),
        "actor_name": actor.name,
        "actor_email": actor.email,
        "changed_fields": change.changed_fields,
        "changes": change.changes,
        "summary": change.summary,
        "created_at": change.created_at,
    }


def _delete_request_status(change: CampaignDriveChange) -> str | None:
    if "delete_request" not in (change.changed_fields or []):
        return None
    payload = (change.changes or {}).get("delete_request") or {}
    return payload.get("status")


async def _approved_delete_campaign_ids(db: AsyncSession) -> set[UUID]:
    rows = (
        await db.execute(
            select(CampaignDriveChange)
        )
    ).scalars().all()
    return {
        change.campaign_id
        for change in rows
        if _delete_request_status(change) == "approved"
    }


async def _serialize_static_campaigns(
    db: AsyncSession,
    user: User | None = None,
) -> list[dict]:
    now = datetime.now(timezone.utc)
    items = []
    for campaign in STATIC_CAMPAIGNS:
        donated_xlm, donor_count = await _donation_totals(db, campaign["id"])
        raised = campaign["raised_amount"] + donated_xlm * DEMO_XLM_TO_PHP
        donors = campaign["donors"] + donor_count
        items.append(
            _serialize_public_campaign(
                campaign_id=campaign["id"],
                organizer_id=user.id if user else None,
                organizer_name=user.name if user else STATIC_ORGANIZER_EMAIL,
                title=campaign["title"],
                description=campaign["description"],
                category=campaign["category"],
                status=campaign["status"],
                raised=raised,
                goal=campaign["goal_amount"],
                donors=donors,
                institution=campaign["institution"],
                location=campaign["location"],
                image_src=campaign["image_src"],
                updated_at=now,
                source="seeded",
            )
        )
    return items


async def _static_drives_for_user(db: AsyncSession, user: User) -> list[dict]:
    if user.email.lower() != STATIC_ORGANIZER_EMAIL:
        return []

    return await _serialize_static_campaigns(db, user)


async def _public_campaigns(db: AsyncSession) -> list[dict]:
    deleted_ids = await _approved_delete_campaign_ids(db)
    drives = (
        await db.execute(
            select(CampaignDrive)
            .where(CampaignDrive.status.in_([CampaignDriveStatus.active, CampaignDriveStatus.funded]))
            .order_by(CampaignDrive.updated_at.desc())
        )
    ).scalars().all()

    items = await _serialize_static_campaigns(db)
    for drive in drives:
        if drive.id in deleted_ids:
            continue
        items.append(await _serialize_drive(db, drive))
    items.sort(key=lambda item: item["updated_at"], reverse=True)
    return items


async def _confirmed_campaign_donations(
    db: AsyncSession,
    campaign_id: str,
    limit: int = 25,
) -> list[dict]:
    rows = (
        await db.execute(
            select(Donation, User)
            .join(User, User.id == Donation.donor_id)
            .where(
                Donation.purpose == f"campaign:{campaign_id}",
                Donation.blockchain_confirmed.is_(True),
            )
            .order_by(Donation.created_at.desc())
            .limit(limit)
        )
    ).all()

    return [
        {
            "id": str(donation.id),
            "donor_id": str(donation.donor_id),
            "donor_name": user.name,
            "amount": float(donation.amount),
            "asset": donation.asset,
            "amount_php": float(donation.amount) * DEMO_XLM_TO_PHP,
            "stellar_tx_hash": donation.stellar_tx_hash,
            "blockchain_confirmed": donation.blockchain_confirmed,
            "disbursed": donation.disbursed,
            "disbursed_amount": float(donation.disbursed_amount),
            "created_at": donation.created_at,
        }
        for donation, user in rows
    ]


def _campaign_title_by_id(campaigns: list[dict]) -> dict[str, str]:
    return {item["id"]: item["title"] for item in campaigns}


async def _anchored_proof_documents(db: AsyncSession, limit: int = 25) -> list[dict]:
    rows = (
        await db.execute(
            select(ProofArtifact, AidRequest)
            .join(AidRequest, AidRequest.id == ProofArtifact.aid_request_id)
            .where(
                ProofArtifact.deleted_at.is_(None),
                ProofArtifact.stellar_anchor_tx.is_not(None),
            )
            .order_by(ProofArtifact.created_at.desc())
            .limit(limit)
        )
    ).all()

    return [
        {
            "id": str(proof.id),
            "kind": proof.kind.value if hasattr(proof.kind, "value") else proof.kind,
            "title": proof.description or proof.filename,
            "filename": proof.filename,
            "campaign_title": aid_request.purpose,
            "claimed_amount": float(proof.claimed_amount or 0),
            "sha256": proof.sha256,
            "stellar_tx_hash": proof.stellar_anchor_tx,
            "created_at": proof.created_at,
            "status": "Verified",
            "source": "proof_artifact",
        }
        for proof, aid_request in rows
        if proof.stellar_anchor_tx
    ]


async def _confirmed_donation_proofs(db: AsyncSession, campaigns: list[dict], limit: int = 25) -> list[dict]:
    campaign_titles = _campaign_title_by_id(campaigns)
    rows = (
        await db.execute(
            select(Donation, User)
            .join(User, User.id == Donation.donor_id)
            .where(
                Donation.purpose.like("campaign:%"),
                Donation.blockchain_confirmed.is_(True),
            )
            .order_by(Donation.created_at.desc())
            .limit(limit)
        )
    ).all()

    items = []
    for donation, user in rows:
        campaign_id = (donation.purpose or "").replace("campaign:", "", 1)
        amount = float(donation.amount)
        items.append(
            {
                "id": str(donation.id),
                "kind": "stellar_transaction",
                "title": f"Confirmed donation - {campaign_titles.get(campaign_id, campaign_id)}",
                "filename": None,
                "campaign_id": campaign_id,
                "campaign_title": campaign_titles.get(campaign_id, campaign_id),
                "donor_name": user.name,
                "claimed_amount": amount * DEMO_XLM_TO_PHP,
                "amount_xlm": amount,
                "sha256": None,
                "stellar_tx_hash": donation.stellar_tx_hash,
                "created_at": donation.created_at,
                "status": "Verified",
                "source": "confirmed_donation",
            }
        )
    return items


@router.get("/public")
async def public_campaigns(db: AsyncSession = Depends(get_db)):
    return {"success": True, "data": await _public_campaigns(db)}


@router.post("/uploads/cover", status_code=201)
async def upload_campaign_cover(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    url = await _save_campaign_cover(file, user)
    return {"success": True, "data": {"url": url}}


@router.get("/uploads/{filename}")
async def get_campaign_upload(filename: str):
    if "/" in filename or "\\" in filename:
        raise HTTPException(status_code=404, detail="File not found")

    path = os.path.join(CAMPAIGN_UPLOAD_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")

    media_type = "image/webp"
    if filename.lower().endswith(".png"):
        media_type = "image/png"
    elif filename.lower().endswith((".jpg", ".jpeg")):
        media_type = "image/jpeg"

    return FileResponse(path, media_type=media_type)


@router.get("/admin/change-log")
async def campaign_change_log(
    limit: int = 25,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (
        await db.execute(
            select(CampaignDriveChange, CampaignDrive, User)
            .join(CampaignDrive, CampaignDrive.id == CampaignDriveChange.campaign_id)
            .join(User, User.id == CampaignDriveChange.actor_id)
            .order_by(CampaignDriveChange.created_at.desc())
            .limit(min(max(limit, 1), 100))
        )
    ).all()

    return {
        "success": True,
        "data": [_change_log_payload(change, campaign, actor) for change, campaign, actor in rows],
    }


@router.get("/admin/delete-requests")
async def campaign_delete_requests(
    limit: int = 25,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (
        await db.execute(
            select(CampaignDriveChange, CampaignDrive, User)
            .join(CampaignDrive, CampaignDrive.id == CampaignDriveChange.campaign_id)
            .join(User, User.id == CampaignDriveChange.actor_id)
            .order_by(CampaignDriveChange.created_at.desc())
        )
    ).all()
    rows = [row for row in rows if "delete_request" in (row[0].changed_fields or [])][: min(max(limit, 1), 100)]

    return {
        "success": True,
        "data": [_change_log_payload(change, campaign, actor) for change, campaign, actor in rows],
    }


@router.post("/admin/delete-requests/{request_id}/approve")
async def approve_campaign_delete_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    row = (
        await db.execute(
            select(CampaignDriveChange, CampaignDrive, User)
            .join(CampaignDrive, CampaignDrive.id == CampaignDriveChange.campaign_id)
            .join(User, User.id == CampaignDriveChange.actor_id)
            .where(CampaignDriveChange.id == request_id)
        )
    ).one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Delete request not found.")

    change, campaign, actor = row
    if _delete_request_status(change) != "pending":
        raise HTTPException(status_code=400, detail="Delete request is no longer pending.")

    change.changes = {
        **(change.changes or {}),
        "delete_request": {
            **((change.changes or {}).get("delete_request") or {}),
            "status": "approved",
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
        },
    }
    change.summary = f"Admin approved deletion request for {campaign.title}."
    campaign.status = CampaignDriveStatus.draft
    await db.commit()
    await db.refresh(change)
    return {"success": True, "message": "Delete request approved", "data": _change_log_payload(change, campaign, actor)}


@router.post("/admin/delete-requests/{request_id}/reject")
async def reject_campaign_delete_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    row = (
        await db.execute(
            select(CampaignDriveChange, CampaignDrive, User)
            .join(CampaignDrive, CampaignDrive.id == CampaignDriveChange.campaign_id)
            .join(User, User.id == CampaignDriveChange.actor_id)
            .where(CampaignDriveChange.id == request_id)
        )
    ).one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Delete request not found.")

    change, campaign, actor = row
    if _delete_request_status(change) != "pending":
        raise HTTPException(status_code=400, detail="Delete request is no longer pending.")

    change.changes = {
        **(change.changes or {}),
        "delete_request": {
            **((change.changes or {}).get("delete_request") or {}),
            "status": "rejected",
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
        },
    }
    change.summary = f"Admin rejected deletion request for {campaign.title}."
    await db.commit()
    await db.refresh(change)
    return {"success": True, "message": "Delete request rejected", "data": _change_log_payload(change, campaign, actor)}


@router.get("/proof-center")
async def public_proof_center(db: AsyncSession = Depends(get_db)):
    campaigns = await _public_campaigns(db)
    donation_proofs = await _confirmed_donation_proofs(db, campaigns)
    document_proofs = await _anchored_proof_documents(db)
    documents = sorted(
        [*donation_proofs, *document_proofs],
        key=lambda item: item["created_at"],
        reverse=True,
    )

    verified_amount_php = sum(item.get("claimed_amount") or 0 for item in donation_proofs)
    risk_feed = []
    for campaign in campaigns:
      has_confirmed_funds = campaign["raised_amount"] > 0
      risk_feed.append(
          {
              "campaign_id": campaign["id"],
              "campaign_title": campaign["title"],
              "level": "LOW RISK" if has_confirmed_funds else "AWAITING PROOF",
              "status": "Verified Stellar funding trail found."
              if has_confirmed_funds
              else "No confirmed donation or anchored proof has been recorded yet.",
              "confidence": 97 if has_confirmed_funds else 0,
              "created_at": campaign["updated_at"],
          }
      )

    return {
        "success": True,
        "data": {
            "stats": {
                "verified_documents": len(documents),
                "confirmed_donations": len(donation_proofs),
                "anchored_documents": len(document_proofs),
                "verified_amount_php": verified_amount_php,
            },
            "risk_feed": risk_feed,
            "documents": documents,
        },
    }


@router.get("/public/{campaign_id}/escrow")
async def public_campaign_escrow(campaign_id: str, db: AsyncSession = Depends(get_db)):
    items = await _public_campaigns(db)
    campaign = next(
        (item for item in items if item["id"] == campaign_id or item["slug"] == campaign_id),
        None,
    )
    if not campaign:
        return {"success": False, "message": "Campaign not found", "data": None}

    donations = await _confirmed_campaign_donations(db, campaign["id"])
    total_xlm = sum(item["amount"] for item in donations)
    total_php = sum(item["amount_php"] for item in donations)
    released_php = sum(item["disbursed_amount"] * DEMO_XLM_TO_PHP for item in donations if item["disbursed"])
    locked_php = max(total_php - released_php, 0)

    return {
        "success": True,
        "data": {
            "campaign": campaign,
            "summary": {
                "total_escrowed_xlm": total_xlm,
                "total_escrowed_php": total_php,
                "released_php": released_php,
                "locked_php": locked_php,
                "pending_verification_php": locked_php,
                "confirmed_donation_count": len(donations),
            },
            "transactions": donations,
        },
    }


@router.get("/public/{campaign_id}")
async def public_campaign(campaign_id: str, db: AsyncSession = Depends(get_db)):
    items = await _public_campaigns(db)
    for item in items:
        if item["id"] == campaign_id or item["slug"] == campaign_id:
            return {"success": True, "data": item}
    return {"success": False, "message": "Campaign not found", "data": None}


@router.get("/mine")
async def my_campaigns(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    deleted_ids = await _approved_delete_campaign_ids(db)
    db_drives = (
        await db.execute(
            select(CampaignDrive)
            .where(CampaignDrive.organizer_id == user.id)
            .order_by(CampaignDrive.updated_at.desc())
        )
    ).scalars().all()

    items = await _static_drives_for_user(db, user)
    for drive in db_drives:
        if drive.id in deleted_ids:
            continue
        items.append(await _serialize_drive(db, drive))
    items.sort(key=lambda item: item["updated_at"], reverse=True)
    return {"success": True, "data": items}


@router.post("/{campaign_id}/delete-request")
async def request_campaign_deletion(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    drive = (
        await db.execute(
            select(CampaignDrive).where(
                CampaignDrive.id == campaign_id,
                CampaignDrive.organizer_id == user.id,
            )
        )
    ).scalar_one_or_none()
    if not drive:
        raise HTTPException(status_code=404, detail="Campaign not found or you do not have permission to delete it.")

    existing = (
        await db.execute(
            select(CampaignDriveChange).where(
                CampaignDriveChange.campaign_id == drive.id,
                CampaignDriveChange.actor_id == user.id,
            ).order_by(CampaignDriveChange.created_at.desc())
        )
    ).scalars().all()
    existing = next((change for change in existing if "delete_request" in (change.changed_fields or [])), None)
    if existing and _delete_request_status(existing) == "pending":
        return {
            "success": True,
            "message": "Delete request already pending",
            "data": _change_log_payload(existing, drive, user),
        }

    change = CampaignDriveChange(
        campaign_id=drive.id,
        actor_id=user.id,
        changed_fields=["delete_request"],
        changes={
            "delete_request": {
                "status": "pending",
                "requested_title": drive.title,
                "requested_at": datetime.now(timezone.utc).isoformat(),
            }
        },
        summary=f"{user.name} requested deletion review for {drive.title}.",
    )
    db.add(change)
    await db.commit()
    await db.refresh(change)
    return {"success": True, "message": "Delete request sent to admin", "data": _change_log_payload(change, drive, user)}


@router.patch("/{campaign_id}")
async def update_campaign(
    campaign_id: UUID,
    body: CampaignDriveUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    drive = (
        await db.execute(
            select(CampaignDrive).where(
                CampaignDrive.id == campaign_id,
                CampaignDrive.organizer_id == user.id,
            )
        )
    ).scalar_one_or_none()
    if not drive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found or you do not have permission to edit it.",
        )

    incoming = body.model_dump(exclude_unset=True)
    allowed_fields = ["title", "description", "category", "institution", "location", "goal_amount", "image_src"]
    changes: dict[str, dict] = {}

    for field in allowed_fields:
        if field not in incoming:
            continue
        new_value = incoming[field]
        if new_value is None and field != "image_src":
            continue
        old_value = getattr(drive, field)
        comparable_old = float(old_value) if field == "goal_amount" and old_value is not None else old_value
        comparable_new = float(new_value) if field == "goal_amount" and new_value is not None else new_value
        if comparable_old == comparable_new:
            continue
        changes[field] = {"before": comparable_old, "after": comparable_new}
        setattr(drive, field, new_value)

    if changes:
        changed_fields = list(changes.keys())
        change = CampaignDriveChange(
            campaign_id=drive.id,
            actor_id=user.id,
            changed_fields=changed_fields,
            changes=changes,
            summary=_summarize_changes(changed_fields),
        )
        db.add(change)

    await db.commit()
    await db.refresh(drive)
    return {
        "success": True,
        "message": "Campaign updated",
        "data": await _serialize_drive(db, drive),
    }


def _release_request_status(change: CampaignDriveChange) -> str | None:
    if "release_request" not in (change.changed_fields or []):
        return None
    payload = (change.changes or {}).get("release_request") or {}
    return payload.get("status")


@router.post("/{campaign_id}/release-request")
async def request_fund_release(
    campaign_id: UUID,
    body: CampaignReleaseRequestCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Organizer requests that collected funds be handed down to the recipient."""
    drive = (
        await db.execute(
            select(CampaignDrive).where(
                CampaignDrive.id == campaign_id,
                CampaignDrive.organizer_id == user.id,
            )
        )
    ).scalar_one_or_none()
    if not drive:
        raise HTTPException(status_code=404, detail="Campaign not found or you do not have permission.")

    # Block duplicate pending requests
    existing_changes = (
        await db.execute(
            select(CampaignDriveChange).where(
                CampaignDriveChange.campaign_id == drive.id,
            ).order_by(CampaignDriveChange.created_at.desc())
        )
    ).scalars().all()
    pending = next(
        (c for c in existing_changes if _release_request_status(c) == "pending"),
        None,
    )
    if pending:
        return {
            "success": True,
            "message": "Release request already pending",
            "data": _change_log_payload(pending, drive, user),
        }

    change = CampaignDriveChange(
        campaign_id=drive.id,
        actor_id=user.id,
        changed_fields=["release_request"],
        changes={
            "release_request": {
                "status": "pending",
                "recipient_name": body.recipient_name,
                "recipient_type": body.recipient_type,
                "recipient_reference": body.recipient_reference,
                "amount_xlm": body.amount_xlm,
                "note": body.note,
                "requested_at": datetime.now(timezone.utc).isoformat(),
            }
        },
        summary=f"{user.name} requested fund release for {drive.title} → {body.recipient_name}.",
    )
    db.add(change)
    await db.commit()
    await db.refresh(change)
    return {
        "success": True,
        "message": "Fund release request sent to admin",
        "data": _change_log_payload(change, drive, user),
    }


@router.get("/admin/release-requests")
async def campaign_release_requests(
    limit: int = 25,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (
        await db.execute(
            select(CampaignDriveChange, CampaignDrive, User)
            .join(CampaignDrive, CampaignDrive.id == CampaignDriveChange.campaign_id)
            .join(User, User.id == CampaignDriveChange.actor_id)
            .order_by(CampaignDriveChange.created_at.desc())
        )
    ).all()
    rows = [row for row in rows if "release_request" in (row[0].changed_fields or [])][: min(max(limit, 1), 100)]
    return {
        "success": True,
        "data": [_change_log_payload(change, campaign, actor) for change, campaign, actor in rows],
    }


@router.post("/admin/release-requests/{request_id}/approve")
async def approve_release_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    row = (
        await db.execute(
            select(CampaignDriveChange, CampaignDrive, User)
            .join(CampaignDrive, CampaignDrive.id == CampaignDriveChange.campaign_id)
            .join(User, User.id == CampaignDriveChange.actor_id)
            .where(CampaignDriveChange.id == request_id)
        )
    ).one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Release request not found.")

    change, campaign, actor = row
    if _release_request_status(change) != "pending":
        raise HTTPException(status_code=400, detail="Release request is no longer pending.")

    change.changes = {
        **(change.changes or {}),
        "release_request": {
            **((change.changes or {}).get("release_request") or {}),
            "status": "approved",
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
        },
    }
    change.summary = f"Admin approved fund release for {campaign.title}. Organizer must now upload handoff proof."
    await db.commit()
    await db.refresh(change)
    return {
        "success": True,
        "message": "Release approved. Organizer must upload handoff proof.",
        "data": _change_log_payload(change, campaign, actor),
    }


@router.post("/admin/release-requests/{request_id}/reject")
async def reject_release_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    row = (
        await db.execute(
            select(CampaignDriveChange, CampaignDrive, User)
            .join(CampaignDrive, CampaignDrive.id == CampaignDriveChange.campaign_id)
            .join(User, User.id == CampaignDriveChange.actor_id)
            .where(CampaignDriveChange.id == request_id)
        )
    ).one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Release request not found.")

    change, campaign, actor = row
    if _release_request_status(change) != "pending":
        raise HTTPException(status_code=400, detail="Release request is no longer pending.")

    change.changes = {
        **(change.changes or {}),
        "release_request": {
            **((change.changes or {}).get("release_request") or {}),
            "status": "rejected",
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
        },
    }
    change.summary = f"Admin rejected fund release request for {campaign.title}."
    await db.commit()
    await db.refresh(change)
    return {
        "success": True,
        "message": "Release request rejected.",
        "data": _change_log_payload(change, campaign, actor),
    }


@router.post("/admin/release-requests/{request_id}/verify-proof")
async def verify_release_proof(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Admin marks the handoff proof as verified, closing the release loop."""
    row = (
        await db.execute(
            select(CampaignDriveChange, CampaignDrive, User)
            .join(CampaignDrive, CampaignDrive.id == CampaignDriveChange.campaign_id)
            .join(User, User.id == CampaignDriveChange.actor_id)
            .where(CampaignDriveChange.id == request_id)
        )
    ).one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Release request not found.")

    change, campaign, actor = row
    current_status = _release_request_status(change)
    if current_status not in ("approved", "proof_uploaded"):
        raise HTTPException(
            status_code=400,
            detail="Can only verify proof on an approved release that has proof uploaded.",
        )

    change.changes = {
        **(change.changes or {}),
        "release_request": {
            **((change.changes or {}).get("release_request") or {}),
            "status": "closed",
            "verified_at": datetime.now(timezone.utc).isoformat(),
        },
    }
    change.summary = f"Admin verified handoff proof for {campaign.title}. Release closed."

    # Mark all campaign donations as disbursed
    donations = (
        await db.execute(
            select(Donation).where(
                Donation.purpose == f"campaign:{campaign.id}",
                Donation.blockchain_confirmed.is_(True),
            )
        )
    ).scalars().all()
    for donation in donations:
        donation.disbursed = True
        donation.disbursed_amount = float(donation.amount)

    await db.commit()
    await db.refresh(change)
    return {
        "success": True,
        "message": "Handoff proof verified. All campaign donations marked as disbursed.",
        "data": _change_log_payload(change, campaign, actor),
    }


@router.post("", status_code=201)
async def create_campaign(
    body: CampaignDriveCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    drive = CampaignDrive(
        organizer_id=user.id,
        title=body.title,
        description=body.description,
        category=body.category,
        institution=body.institution,
        location=body.location,
        goal_amount=body.goal_amount,
        status=CampaignDriveStatus.active,
        image_src=body.image_src,
    )
    db.add(drive)
    await db.commit()
    await db.refresh(drive)
    return {
        "success": True,
        "message": "Campaign published",
        "data": await _serialize_drive(db, drive),
    }
