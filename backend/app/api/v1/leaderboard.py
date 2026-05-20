from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.donation import Donation
from app.models.user import User

router = APIRouter(prefix="/donors", tags=["donors"])


@router.get("/leaderboard")
async def donor_leaderboard(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.execute(
            select(
                Donation.donor_id,
                func.sum(Donation.amount).label("total"),
                func.count(Donation.id).label("count"),
            )
            .group_by(Donation.donor_id)
            .order_by(func.sum(Donation.amount).desc())
            .limit(limit)
        )
    ).all()

    items = []
    for rank, row in enumerate(rows, 1):
        user = (
            await db.execute(select(User).where(User.id == row.donor_id))
        ).scalar_one_or_none()
        if user:
            items.append({
                "rank": rank,
                "name": user.name,
                "total_donated": float(row.total),
                "donation_count": int(row.count),
            })

    return {"success": True, "data": items}


@router.get("/me/impact")
async def my_impact(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = (
        await db.execute(
            select(
                func.coalesce(func.sum(Donation.amount), 0).label("total"),
                func.count(Donation.id).label("count"),
            ).where(Donation.donor_id == user.id)
        )
    ).one()

    total = float(row.total)
    count = int(row.count)
    lives = max(1, int(total / 2000)) if total > 0 else 0

    return {
        "success": True,
        "data": {
            "name": user.name,
            "total_donated": total,
            "campaigns_helped": count,
            "lives_impacted": lives,
        },
    }
