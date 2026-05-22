from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.campaign_drive import CampaignDrive, CampaignDriveStatus
from app.models.donation import Donation
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
        "raised_amount": 7498.0,
        "goal_amount": 15000.0,
        "donors": 6,
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
        "raised_amount": 756728.0,
        "goal_amount": 900000.0,
        "donors": 523,
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
        "raised_amount": 13110.0,
        "goal_amount": 51300.0,
        "donors": 10,
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
            ).where(Donation.purpose == f"campaign:{campaign_id}")
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


@router.get("/public")
async def public_campaigns(db: AsyncSession = Depends(get_db)):
    return {"success": True, "data": await _public_campaigns(db)}


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
