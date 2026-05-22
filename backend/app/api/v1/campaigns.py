from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.campaign_drive import CampaignDrive
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


def _serialize_drive(drive: CampaignDrive) -> dict:
    raised = float(drive.raised_amount)
    goal = float(drive.goal_amount)
    return {
        "id": str(drive.id),
        "organizer_id": drive.organizer_id,
        "title": drive.title,
        "description": drive.description,
        "category": drive.category,
        "status": drive.status.value,
        "raised_amount": raised,
        "goal_amount": goal,
        "progress": _progress(raised, goal),
        "donors": drive.donors,
        "institution": drive.institution,
        "location": drive.location,
        "image_src": drive.image_src,
        "updated_at": drive.updated_at,
        "source": "database",
    }


async def _static_donation_totals(db: AsyncSession, campaign_id: str) -> tuple[float, int]:
    row = (
        await db.execute(
            select(
                func.coalesce(func.sum(Donation.amount), 0).label("total"),
                func.count(distinct(Donation.donor_id)).label("donors"),
            ).where(Donation.purpose == f"campaign:{campaign_id}")
        )
    ).one()
    return float(row.total or 0), int(row.donors or 0)


async def _static_drives_for_user(db: AsyncSession, user: User) -> list[dict]:
    if user.email.lower() != STATIC_ORGANIZER_EMAIL:
        return []

    items = []
    now = datetime.now(timezone.utc)
    for campaign in STATIC_CAMPAIGNS:
        donated_xlm, donor_count = await _static_donation_totals(db, campaign["id"])
        raised = campaign["raised_amount"] + donated_xlm * DEMO_XLM_TO_PHP
        donors = campaign["donors"] + donor_count
        items.append({
            **campaign,
            "organizer_id": user.id,
            "raised_amount": raised,
            "progress": _progress(raised, campaign["goal_amount"]),
            "donors": donors,
            "updated_at": now,
            "source": "seeded",
        })
    return items


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
    items.extend(_serialize_drive(drive) for drive in db_drives)
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
        image_src=body.image_src,
    )
    db.add(drive)
    await db.commit()
    await db.refresh(drive)
    return {
        "success": True,
        "message": "Campaign saved for verification",
        "data": _serialize_drive(drive),
    }
