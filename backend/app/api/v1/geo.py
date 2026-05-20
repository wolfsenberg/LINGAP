"""Geo-based discovery endpoints (Near Me)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.geo.haversine import bounding_box, haversine_km
from app.models.aid_request import AidRequest, AidRequestStatus
from app.models.beneficiary import Beneficiary

router = APIRouter(prefix="/aid-requests/near", tags=["geo"])


@router.get("")
async def list_nearby_aid_requests(
    lat: float = Query(..., ge=-90, le=90, description="Caller latitude (WGS84)"),
    lng: float = Query(..., ge=-180, le=180, description="Caller longitude (WGS84)"),
    radius_km: float = Query(10.0, gt=0, le=500, description="Search radius in kilometers"),
    status: str | None = Query(
        "approved",
        description="Filter by AidRequest status; pass empty/null for all",
    ),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Return aid requests whose beneficiary is within ``radius_km`` of (lat,lng).

    Two-stage filter: bounding-box prefilter in SQL, exact Haversine refinement
    in Python. Beneficiaries without coordinates are skipped silently — they
    appear in the regular list endpoint, just not here.
    """
    min_lat, max_lat, min_lon, max_lon = bounding_box(lat, lng, radius_km)

    q = (
        select(AidRequest, Beneficiary)
        .join(Beneficiary, Beneficiary.id == AidRequest.beneficiary_id)
        .where(
            Beneficiary.latitude.is_not(None),
            Beneficiary.longitude.is_not(None),
            Beneficiary.latitude.between(min_lat, max_lat),
            Beneficiary.longitude.between(min_lon, max_lon),
        )
    )

    if status:
        try:
            q = q.where(AidRequest.status == AidRequestStatus(status))
        except ValueError:
            return {"items": [], "total": 0, "origin": {"lat": lat, "lng": lng}, "radius_km": radius_km}

    rows = (await db.execute(q)).all()

    items: list[dict] = []
    for req, ben in rows:
        distance = haversine_km(lat, lng, float(ben.latitude), float(ben.longitude))
        if distance > radius_km:
            continue
        items.append(
            {
                "aid_request_id": str(req.id),
                "beneficiary_id": str(ben.id),
                "beneficiary_name": ben.name,
                "purpose": req.purpose,
                "requested_amount": float(req.requested_amount),
                "asset": req.asset,
                "status": req.status.value if hasattr(req.status, "value") else req.status,
                "latitude": float(ben.latitude),
                "longitude": float(ben.longitude),
                "distance_km": round(distance, 3),
            }
        )

    items.sort(key=lambda x: x["distance_km"])
    items = items[:limit]
    return {
        "items": items,
        "total": len(items),
        "origin": {"lat": lat, "lng": lng},
        "radius_km": radius_km,
    }
