from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.campaigns import DEMO_XLM_TO_PHP, _serialize_drive, _static_drives_for_user
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.campaign_drive import CampaignDrive, CampaignDriveStatus
from app.models.donation import Donation
from app.models.donation_certificate import DonationCertificate
from app.models.user import User

router = APIRouter(prefix="/profiles", tags=["profiles"])


def _badge_set(total_xlm: float, campaigns_count: int, cert_count: int) -> list[dict]:
    return [
        {
            "title": "Hope Giver",
            "description": "Made a verified donation",
            "earned": total_xlm > 0,
        },
        {
            "title": "Campaign Organizer",
            "description": "Created a verified campaign",
            "earned": campaigns_count > 0,
        },
        {
            "title": "Proof Builder",
            "description": "Has public impact certificates",
            "earned": cert_count > 0,
        },
        {
            "title": "Community Leader",
            "description": "Reached 1,000+ public XLM impact",
            "earned": total_xlm >= 1000,
        },
    ]


async def _public_campaigns_for_user(db: AsyncSession, user: User) -> list[dict]:
    drives = (
        await db.execute(
            select(CampaignDrive)
            .where(
                CampaignDrive.organizer_id == user.id,
                CampaignDrive.status.in_([CampaignDriveStatus.active, CampaignDriveStatus.funded]),
            )
            .order_by(CampaignDrive.updated_at.desc())
        )
    ).scalars().all()

    items = await _static_drives_for_user(db, user)
    for drive in drives:
        items.append(await _serialize_drive(db, drive))
    items.sort(key=lambda item: item["updated_at"], reverse=True)
    return items


async def _public_rank(db: AsyncSession, user_id) -> int | None:
    rows = (
        await db.execute(
            select(
                Donation.donor_id,
                func.coalesce(func.sum(Donation.amount), 0).label("total"),
            )
            .where(Donation.blockchain_confirmed.is_(True))
            .group_by(Donation.donor_id)
            .order_by(func.coalesce(func.sum(Donation.amount), 0).desc())
        )
    ).all()

    for rank, row in enumerate(rows, 1):
        if row.donor_id == user_id:
            return rank
    return None


async def _profile_payload(db: AsyncSession, user: User) -> dict:
    donation_row = (
        await db.execute(
            select(
                func.coalesce(func.sum(Donation.amount), 0).label("total"),
                func.count(Donation.id).label("count"),
                func.max(Donation.created_at).label("last_activity_at"),
            ).where(
                Donation.donor_id == user.id,
                Donation.blockchain_confirmed.is_(True),
            )
        )
    ).one()

    campaigns = await _public_campaigns_for_user(db, user)
    cert_rows = (
        await db.execute(
            select(DonationCertificate, Donation)
            .join(Donation, Donation.id == DonationCertificate.donation_id)
            .where(
                Donation.donor_id == user.id,
                DonationCertificate.is_public.is_(True),
            )
            .order_by(DonationCertificate.created_at.desc())
            .limit(6)
        )
    ).all()

    activity_rows = (
        await db.execute(
            select(Donation)
            .where(
                Donation.donor_id == user.id,
                Donation.blockchain_confirmed.is_(True),
                Donation.purpose.like("campaign:%"),
            )
            .order_by(Donation.created_at.desc())
            .limit(8)
        )
    ).scalars().all()

    total_xlm = float(donation_row.total or 0)
    donation_count = int(donation_row.count or 0)
    certificates = [
        {
            "id": str(cert.id),
            "beneficiary_name": cert.beneficiary_name,
            "amount": float(cert.amount),
            "lives_touched": cert.lives_touched,
            "stellar_tx_hash": cert.stellar_tx_hash,
            "verified": cert.verified,
            "created_at": cert.created_at,
        }
        for cert, _donation in cert_rows
    ]
    activity = [
        {
            "id": str(donation.id),
            "campaign_id": (donation.purpose or "").replace("campaign:", "", 1),
            "amount": float(donation.amount),
            "asset": donation.asset,
            "stellar_tx_hash": donation.stellar_tx_hash,
            "created_at": donation.created_at,
        }
        for donation in activity_rows
    ]

    active_campaigns = [item for item in campaigns if item["status"].lower() == "active"]
    completed_campaigns = [item for item in campaigns if item["status"].lower() == "funded"]

    return {
        "user": {
            "id": str(user.id),
            "display_name": user.name,
            "role": user.role.value if hasattr(user.role, "value") else user.role,
            "kyc_verified": user.kyc_verified,
            "joined_at": user.created_at,
        },
        "impact": {
            "total_donated_xlm": total_xlm,
            "total_donated_php": total_xlm * DEMO_XLM_TO_PHP,
            "donation_count": donation_count,
            "campaigns_organized": len(campaigns),
            "active_campaigns": len(active_campaigns),
            "completed_campaigns": len(completed_campaigns),
            "public_certificates": len(certificates),
            "community_rank": await _public_rank(db, user.id),
            "last_activity_at": donation_row.last_activity_at,
        },
        "campaigns": campaigns,
        "certificates": certificates,
        "activity": activity,
        "badges": _badge_set(total_xlm, len(campaigns), len(certificates)),
    }


@router.get("/search")
async def search_profiles(
    q: str = Query("", max_length=80),
    limit: int = Query(8, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    term = q.strip()
    query = select(User).order_by(User.created_at.desc()).limit(limit)
    if term:
        like = f"%{term.lower()}%"
        query = (
            select(User)
            .where(or_(func.lower(User.name).like(like), func.lower(User.email).like(like)))
            .order_by(User.created_at.desc())
            .limit(limit)
        )

    users = (await db.execute(query)).scalars().all()
    items = []
    for user in users:
        payload = await _profile_payload(db, user)
        items.append(
            {
                "user": payload["user"],
                "impact": payload["impact"],
                "top_campaigns": payload["campaigns"][:3],
                "badges": payload["badges"],
            }
        )
    return {"success": True, "data": items}


@router.get("/me")
async def my_public_profile(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return {"success": True, "data": await _profile_payload(db, user)}


@router.get("/{user_id}")
async def public_profile(user_id: str, db: AsyncSession = Depends(get_db)):
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        return {"success": False, "message": "Profile not found", "data": None}

    return {"success": True, "data": await _profile_payload(db, user)}
