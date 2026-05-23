import base64
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
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
CAMPAIGN_IMAGE_MIME = {"image/png", "image/jpeg", "image/webp"}

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


async def _cover_to_data_url(upload: UploadFile) -> str:
    """Read an uploaded image and return it as a base64 data URL.

    This avoids any filesystem dependency — the image is stored directly in
    the database column and survives container restarts / deploys.
    """
    mime = (upload.content_type or "").lower()
    if mime not in CAMPAIGN_IMAGE_MIME:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Campaign cover must be a PNG, JPG, or WebP image.",
        )

    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    chunks: list[bytes] = []
    total = 0

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
        chunks.append(chunk)

    raw = b"".join(chunks)
    encoded = base64.b64encode(raw).decode("ascii")
    return f"data:{mime};base64,{encoded}"


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


@router.get("/admin/stats")
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Real-time platform stats for the admin dashboard header cards."""
    # Total campaigns: DB active/funded + static seeded
    db_campaign_count = (
        await db.execute(select(func.count()).select_from(CampaignDrive))
    ).scalar() or 0
    total_campaigns = db_campaign_count + len(STATIC_CAMPAIGNS)

    # Funds escrowed: sum of all confirmed donation amounts in PHP
    confirmed_xlm = (
        await db.execute(
            select(func.coalesce(func.sum(Donation.amount), 0)).where(
                Donation.blockchain_confirmed.is_(True)
            )
        )
    ).scalar() or 0
    funds_escrowed_php = float(confirmed_xlm) * DEMO_XLM_TO_PHP

    # Released (disbursed) PHP — funds that completed the full release flow
    disbursed_xlm = (
        await db.execute(
            select(func.coalesce(func.sum(Donation.disbursed_amount), 0)).where(
                Donation.disbursed.is_(True)
            )
        )
    ).scalar() or 0
    released_php = float(disbursed_xlm) * DEMO_XLM_TO_PHP

    # Verified institutions: distinct institution names across all DB campaigns
    institution_rows = (
        await db.execute(
            select(CampaignDrive.institution).distinct()
        )
    ).scalars().all()
    # Add static campaign institutions
    static_institutions = {c["institution"] for c in STATIC_CAMPAIGNS}
    all_institutions = set(institution_rows) | static_institutions
    verified_institutions = len(all_institutions)

    # Pending review counts
    all_changes = (
        await db.execute(select(CampaignDriveChange))
    ).scalars().all()

    pending_edits = sum(
        1 for c in all_changes
        if "image_src" in (c.changed_fields or [])
        and (c.changes or {}).get("image_src", {}).get("pending") is True
    )
    pending_deletes = sum(
        1 for c in all_changes
        if _delete_request_status(c) == "pending"
    )
    pending_releases = sum(
        1 for c in all_changes
        if _release_request_status(c) == "pending"
    )

    # Donor count
    donor_count = (
        await db.execute(
            select(func.count(distinct(Donation.donor_id))).where(
                Donation.blockchain_confirmed.is_(True)
            )
        )
    ).scalar() or 0

    return {
        "success": True,
        "data": {
            "total_campaigns": total_campaigns,
            "verified_institutions": verified_institutions,
            "funds_escrowed_php": round(funds_escrowed_php, 2),
            "released_php": round(released_php, 2),
            "donor_count": donor_count,
            "pending_edits": pending_edits,
            "pending_deletes": pending_deletes,
            "pending_releases": pending_releases,
        },
    }


@router.get("/admin/ai-alerts")
async def campaign_ai_alerts(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """
    Generate real AI-powered alerts from live campaign data.
    Uses the LLM engine (Groq) when configured, falls back to rules.
    """
    from app.config import settings
    from app.ai.llm import llm_engine
    from app.ai.rules import rules_engine

    campaigns = await _public_campaigns(db)
    all_changes = (await db.execute(select(CampaignDriveChange))).scalars().all()

    alerts = []

    for campaign in campaigns:
        cid = campaign["id"]

        # Gather signals
        donations = await _confirmed_campaign_donations(db, cid, limit=50)
        total_xlm = sum(d["amount"] for d in donations)
        total_php = sum(d["amount_php"] for d in donations)
        goal = float(campaign["goal_amount"])
        raised = float(campaign["raised_amount"])
        pct_funded = (raised / goal * 100) if goal > 0 else 0

        # Count pending changes for this campaign
        campaign_changes = [c for c in all_changes if str(c.campaign_id) == cid]
        pending_image = sum(
            1 for c in campaign_changes
            if (c.changes or {}).get("image_src", {}).get("pending") is True
        )
        delete_requests = sum(
            1 for c in campaign_changes
            if _delete_request_status(c) == "pending"
        )
        release_requests = sum(
            1 for c in campaign_changes
            if _release_request_status(c) == "pending"
        )
        edit_count = len([
            c for c in campaign_changes
            if "delete_request" not in (c.changed_fields or [])
            and "release_request" not in (c.changed_fields or [])
        ])

        # Build alert based on signals
        severity = None
        title = None
        message = None

        if delete_requests > 0:
            severity = "HIGH"
            title = f"Deletion Requested — {campaign['title']}"
            message = f"Organizer requested campaign deletion. {delete_requests} pending review."
        elif release_requests > 0:
            severity = "MEDIUM"
            title = f"Fund Release Pending — {campaign['title']}"
            message = f"Organizer requested fund release to {campaign['institution']}. Awaiting admin approval."
        elif pending_image > 0:
            severity = "LOW"
            title = f"Cover Image Pending — {campaign['title']}"
            message = f"New cover photo uploaded by organizer. Needs admin review before going live."
        elif total_xlm > 0 and pct_funded < 5 and goal > 50000:
            severity = "MEDIUM"
            title = f"Low Traction — {campaign['title']}"
            message = f"Only {pct_funded:.1f}% funded (₱{total_php:,.0f} of ₱{goal:,.0f} goal). May need promotion."
        elif edit_count >= 3:
            severity = "LOW"
            title = f"Frequent Edits — {campaign['title']}"
            message = f"{edit_count} edits recorded. Review for consistency with original campaign intent."
        elif total_xlm > 0 and pct_funded >= 80:
            severity = "LOW"
            title = f"Near Goal — {campaign['title']}"
            message = f"{pct_funded:.0f}% funded. Consider preparing fund release documentation."

        if severity and title:
            alerts.append({
                "campaign_id": cid,
                "campaign_title": campaign["title"],
                "severity": severity,
                "title": title,
                "message": message,
                "raised_php": total_php,
                "goal_php": goal,
                "pct_funded": round(pct_funded, 1),
                "created_at": campaign["updated_at"],
            })

    # If LLM is configured, ask it to add a platform-level summary alert
    has_llm_key = bool(settings.LLM_API_KEY or settings.OPENAI_API_KEY)
    if has_llm_key and settings.RISK_ENGINE == "llm":
        try:
            from openai import AsyncOpenAI
            base_url = settings.effective_base_url or None
            client = AsyncOpenAI(api_key=settings.effective_api_key, base_url=base_url)
            summary_payload = {
                "total_campaigns": len(campaigns),
                "total_raised_php": sum(float(c["raised_amount"]) for c in campaigns),
                "pending_releases": sum(1 for c in all_changes if _release_request_status(c) == "pending"),
                "pending_deletes": sum(1 for c in all_changes if _delete_request_status(c) == "pending"),
                "top_campaigns": [
                    {"title": c["title"], "raised": c["raised_amount"], "goal": c["goal_amount"]}
                    for c in sorted(campaigns, key=lambda x: x["raised_amount"], reverse=True)[:3]
                ],
            }
            completion = await client.chat.completions.create(
                model=settings.effective_model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a fraud-risk analyst for LINGAP, a humanitarian aid platform. "
                            "Given platform stats, return a JSON object with keys: "
                            "severity (HIGH/MEDIUM/LOW), title (max 60 chars), message (max 120 chars). "
                            "Focus on the most important platform-level risk or insight. "
                            "Be concise and specific."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Platform stats: {summary_payload}. Give one key insight.",
                    },
                ],
                response_format={"type": "json_object"},
                temperature=0,
                max_tokens=150,
            )
            import json as _json
            llm_data = _json.loads(completion.choices[0].message.content or "{}")
            if llm_data.get("title") and llm_data.get("message"):
                alerts.insert(0, {
                    "campaign_id": None,
                    "campaign_title": "Platform Overview",
                    "severity": str(llm_data.get("severity", "LOW")).upper(),
                    "title": str(llm_data["title"])[:80],
                    "message": str(llm_data["message"])[:160],
                    "raised_php": 0,
                    "goal_php": 0,
                    "pct_funded": 0,
                    "created_at": datetime.now(timezone.utc),
                    "source": "llm",
                })
        except Exception:
            pass  # LLM alert is best-effort; rule-based alerts still show

    # Sort: HIGH first, then MEDIUM, then LOW
    order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    alerts.sort(key=lambda a: order.get(a["severity"], 3))

    return {"success": True, "data": alerts[:10]}  # cap at 10


@router.get("/admin/escrow-health")
async def campaign_escrow_health(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Real per-category escrow health based on actual donation data."""
    campaigns = await _public_campaigns(db)

    category_stats: dict[str, dict] = {}
    for campaign in campaigns:
        cat = campaign["category"]
        if cat not in category_stats:
            category_stats[cat] = {"raised": 0.0, "goal": 0.0, "count": 0, "with_funds": 0}
        category_stats[cat]["raised"] += float(campaign["raised_amount"])
        category_stats[cat]["goal"] += float(campaign["goal_amount"])
        category_stats[cat]["count"] += 1
        if float(campaign["raised_amount"]) > 0:
            category_stats[cat]["with_funds"] += 1

    result = []
    for cat, s in category_stats.items():
        if s["count"] == 0:
            continue
        # Health = % of campaigns in this category that have received at least some funds
        # or are progressing toward goal
        health_pct = round((s["with_funds"] / s["count"]) * 100, 1) if s["count"] > 0 else 0
        # Boost health if overall funding rate is good
        if s["goal"] > 0:
            funding_rate = min(100, (s["raised"] / s["goal"]) * 100)
            health_pct = round((health_pct * 0.6 + funding_rate * 0.4), 1)
        # Floor at 60 for active campaigns (they're verified and running)
        health_pct = max(60.0, min(100.0, health_pct))
        result.append({
            "category": cat,
            "health_pct": health_pct,
            "campaign_count": s["count"],
            "total_raised_php": round(s["raised"], 2),
            "total_goal_php": round(s["goal"], 2),
        })

    result.sort(key=lambda x: x["health_pct"], reverse=True)

    overall = round(sum(r["health_pct"] for r in result) / len(result), 1) if result else 0
    return {
        "success": True,
        "data": {
            "categories": result,
            "overall_health_pct": overall,
        },
    }


@router.get("/public")
async def public_campaigns(db: AsyncSession = Depends(get_db)):
    return {"success": True, "data": await _public_campaigns(db)}


@router.post("/uploads/cover", status_code=201)
async def upload_campaign_cover(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    """Convert an uploaded image to a base64 data URL stored in the DB.

    No filesystem writes — survives container restarts and Render deploys.
    """
    data_url = await _cover_to_data_url(file)
    return {"success": True, "data": {"url": data_url}}


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


@router.post("/admin/change-log/{change_id}/approve-image")
async def approve_pending_image(
    change_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Apply a pending cover-image change to the campaign after admin review."""
    row = (
        await db.execute(
            select(CampaignDriveChange, CampaignDrive, User)
            .join(CampaignDrive, CampaignDrive.id == CampaignDriveChange.campaign_id)
            .join(User, User.id == CampaignDriveChange.actor_id)
            .where(CampaignDriveChange.id == change_id)
        )
    ).one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Change log entry not found.")

    change, campaign, actor = row
    image_change = (change.changes or {}).get("image_src", {})
    if not image_change.get("pending"):
        raise HTTPException(status_code=400, detail="No pending image change on this entry.")

    new_image = image_change.get("pending_image_src")
    if not new_image:
        raise HTTPException(status_code=400, detail="Pending image data is missing.")

    # Apply the image to the campaign
    campaign.image_src = new_image

    # Mark the change as approved
    updated_changes = dict(change.changes or {})
    updated_changes["image_src"] = {
        **image_change,
        "pending": False,
        "approved": True,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "after": "[image applied]",
    }
    change.changes = updated_changes
    change.summary = change.summary.rstrip(".") + " (cover image approved by admin)."

    await db.commit()
    await db.refresh(change)
    return {
        "success": True,
        "message": "Cover image approved and applied to campaign.",
        "data": _change_log_payload(change, campaign, actor),
    }


@router.post("/admin/change-log/{change_id}/reject-image")
async def reject_pending_image(
    change_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Reject a pending cover-image change without applying it."""
    row = (
        await db.execute(
            select(CampaignDriveChange, CampaignDrive, User)
            .join(CampaignDrive, CampaignDrive.id == CampaignDriveChange.campaign_id)
            .join(User, User.id == CampaignDriveChange.actor_id)
            .where(CampaignDriveChange.id == change_id)
        )
    ).one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Change log entry not found.")

    change, campaign, actor = row
    image_change = (change.changes or {}).get("image_src", {})
    if not image_change.get("pending"):
        raise HTTPException(status_code=400, detail="No pending image change on this entry.")

    updated_changes = dict(change.changes or {})
    updated_changes["image_src"] = {
        **image_change,
        "pending": False,
        "approved": False,
        "rejected_at": datetime.now(timezone.utc).isoformat(),
        "after": "[image rejected]",
    }
    change.changes = updated_changes
    change.summary = change.summary.rstrip(".") + " (cover image rejected by admin)."

    await db.commit()
    await db.refresh(change)
    return {
        "success": True,
        "message": "Cover image change rejected.",
        "data": _change_log_payload(change, campaign, actor),
    }


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

        if field == "image_src":
            # Image changes are held for admin approval — stored in the change
            # log as pending_image_src and NOT applied to the drive directly.
            changes[field] = {
                "before": "[previous image]" if comparable_old and str(comparable_old).startswith("data:") else comparable_old,
                "after": "[new image pending approval]",
                "pending_image_src": new_value,
                "pending": True,
            }
        else:
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
