from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.aid_request import AidRequest
from app.models.campaign_drive import CampaignDrive, CampaignDriveStatus
from app.models.donation import Donation
from app.models.proof_artifact import ProofArtifact
from app.models.user import User
from app.schemas.campaign_drive import CampaignDriveCreate

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

STATIC_ORGANIZER_EMAIL = "geineldungao012@gmail.com"
DEMO_XLM_TO_PHP = 10

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


async def _donation_totals(db: AsyncSession, campaign_id: str) -> tuple[float, int]:
    row = (
        await db.execute(
            select(
                func.coalesce(func.sum(Donation.amount), 0).label("total"),
                func.count(distinct(Donation.donor_id)).label("donors"),
            ).where(
                Donation.purpose == f"campaign:{campaign_id}",
                Donation.blockchain_confirmed.is_(True),
            )
        )
    ).one()
    return float(row.total or 0), int(row.donors or 0)


def _format_php(amount: float) -> str:
    return f"₱{round(amount):,}"


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
    drives = (
        await db.execute(
            select(CampaignDrive)
            .where(CampaignDrive.status.in_([CampaignDriveStatus.active, CampaignDriveStatus.funded]))
            .order_by(CampaignDrive.updated_at.desc())
        )
    ).scalars().all()

    items = await _serialize_static_campaigns(db)
    for drive in drives:
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
    db_drives = (
        await db.execute(
            select(CampaignDrive)
            .where(CampaignDrive.organizer_id == user.id)
            .order_by(CampaignDrive.updated_at.desc())
        )
    ).scalars().all()

    items = await _static_drives_for_user(db, user)
    for drive in db_drives:
        items.append(await _serialize_drive(db, drive))
    items.sort(key=lambda item: item["updated_at"], reverse=True)
    return {"success": True, "data": items}


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
