"""Tests for Near-Me geo search."""
from __future__ import annotations

import uuid

import pytest

from app.geo.haversine import bounding_box, haversine_km


MANILA = (14.5995, 120.9842)
QUEZON_CITY = (14.6760, 121.0437)  # ~10.5 km from Manila City Hall
CEBU = (10.3157, 123.8854)  # ~570 km from Manila
TOKYO = (35.6762, 139.6503)


def test_haversine_known_distances():
    manila_cebu = haversine_km(*MANILA, *CEBU)
    assert 560 < manila_cebu < 580, f"Manila→Cebu expected ~570km, got {manila_cebu}"

    manila_qc = haversine_km(*MANILA, *QUEZON_CITY)
    assert 9 < manila_qc < 13, f"Manila→QC expected ~10km, got {manila_qc}"

    same_point = haversine_km(*MANILA, *MANILA)
    assert same_point == pytest.approx(0.0, abs=1e-9)


def test_haversine_symmetric():
    assert haversine_km(*MANILA, *TOKYO) == pytest.approx(haversine_km(*TOKYO, *MANILA))


def test_bounding_box_contains_origin():
    min_lat, max_lat, min_lon, max_lon = bounding_box(*MANILA, radius_km=5)
    lat, lon = MANILA
    assert min_lat <= lat <= max_lat
    assert min_lon <= lon <= max_lon
    # ~5 km should be ~0.045° lat delta
    assert (max_lat - min_lat) == pytest.approx(2 * 5 / 111.0, rel=0.01)


async def _seed_beneficiary_with_coords(
    db_session,
    *,
    name: str,
    lat: float | None,
    lng: float | None,
    with_request: bool = True,
):
    from app.models.aid_request import AidRequest, AidRequestStatus
    from app.models.beneficiary import Beneficiary, BeneficiaryCategory, NeedLevel

    b = Beneficiary(
        id=uuid.uuid4(),
        name=name,
        national_id=f"NID-{uuid.uuid4().hex[:8]}",
        location=name,
        category=BeneficiaryCategory.individual,
        need_level=NeedLevel.medium,
        verified=True,
        stellar_public_key=None,
        total_received=0,
        latitude=lat,
        longitude=lng,
    )
    db_session.add(b)
    await db_session.commit()

    req = None
    if with_request:
        req = AidRequest(
            id=uuid.uuid4(),
            beneficiary_id=b.id,
            requested_amount=500,
            asset="XLM",
            purpose=f"Test purpose for {name}",
            status=AidRequestStatus.approved,
        )
        db_session.add(req)
        await db_session.commit()
        await db_session.refresh(req)
    return b, req


@pytest.mark.asyncio
async def test_near_endpoint_returns_within_radius(client, db_session):
    await _seed_beneficiary_with_coords(db_session, name="QC", lat=QUEZON_CITY[0], lng=QUEZON_CITY[1])
    await _seed_beneficiary_with_coords(db_session, name="Cebu", lat=CEBU[0], lng=CEBU[1])

    resp = await client.get(
        "/api/v1/aid-requests/near",
        params={"lat": MANILA[0], "lng": MANILA[1], "radius_km": 50},
    )
    assert resp.status_code == 200
    data = resp.json()
    names = [item["beneficiary_name"] for item in data["items"]]
    assert "QC" in names
    assert "Cebu" not in names
    qc_item = next(i for i in data["items"] if i["beneficiary_name"] == "QC")
    assert 8 < qc_item["distance_km"] < 13


@pytest.mark.asyncio
async def test_near_endpoint_sorts_ascending(client, db_session):
    await _seed_beneficiary_with_coords(db_session, name="QC", lat=QUEZON_CITY[0], lng=QUEZON_CITY[1])
    # ~2 km north of Manila
    await _seed_beneficiary_with_coords(db_session, name="Near", lat=MANILA[0] + 0.018, lng=MANILA[1])

    resp = await client.get(
        "/api/v1/aid-requests/near",
        params={"lat": MANILA[0], "lng": MANILA[1], "radius_km": 50},
    )
    assert resp.status_code == 200
    distances = [item["distance_km"] for item in resp.json()["items"]]
    assert distances == sorted(distances)


@pytest.mark.asyncio
async def test_near_endpoint_skips_null_coords(client, db_session):
    await _seed_beneficiary_with_coords(db_session, name="NoCoords", lat=None, lng=None)
    await _seed_beneficiary_with_coords(db_session, name="QC", lat=QUEZON_CITY[0], lng=QUEZON_CITY[1])

    resp = await client.get(
        "/api/v1/aid-requests/near",
        params={"lat": MANILA[0], "lng": MANILA[1], "radius_km": 50},
    )
    assert resp.status_code == 200
    names = [item["beneficiary_name"] for item in resp.json()["items"]]
    assert "NoCoords" not in names
    assert "QC" in names


@pytest.mark.asyncio
async def test_near_endpoint_status_filter(client, db_session):
    from app.models.aid_request import AidRequest, AidRequestStatus
    from sqlalchemy import select

    b, req = await _seed_beneficiary_with_coords(
        db_session, name="QC", lat=QUEZON_CITY[0], lng=QUEZON_CITY[1]
    )
    req = (await db_session.execute(select(AidRequest).where(AidRequest.id == req.id))).scalar_one()
    req.status = AidRequestStatus.pending
    await db_session.commit()

    resp_approved = await client.get(
        "/api/v1/aid-requests/near",
        params={"lat": MANILA[0], "lng": MANILA[1], "radius_km": 50, "status": "approved"},
    )
    assert resp_approved.status_code == 200
    assert resp_approved.json()["total"] == 0

    resp_pending = await client.get(
        "/api/v1/aid-requests/near",
        params={"lat": MANILA[0], "lng": MANILA[1], "radius_km": 50, "status": "pending"},
    )
    assert resp_pending.status_code == 200
    assert resp_pending.json()["total"] == 1


@pytest.mark.asyncio
async def test_near_endpoint_validation(client):
    # Missing required lat
    resp = await client.get("/api/v1/aid-requests/near", params={"lng": 120})
    assert resp.status_code == 422

    # Out-of-range latitude
    resp = await client.get(
        "/api/v1/aid-requests/near",
        params={"lat": 999, "lng": 120},
    )
    assert resp.status_code == 422

    # Radius too large
    resp = await client.get(
        "/api/v1/aid-requests/near",
        params={"lat": 14.5, "lng": 120.9, "radius_km": 9999},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_beneficiary_create_with_coords(client, db_session, auth_user):
    payload = {
        "name": "GeoTest",
        "national_id": f"NID-{uuid.uuid4().hex[:8]}",
        "location": "Manila",
        "latitude": MANILA[0],
        "longitude": MANILA[1],
    }
    resp = await client.post(
        "/api/v1/beneficiaries", json=payload, headers=auth_user["headers"]
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert data["latitude"] == MANILA[0]
    assert data["longitude"] == MANILA[1]
