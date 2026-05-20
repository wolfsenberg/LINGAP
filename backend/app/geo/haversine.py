"""Great-circle distance helpers for the Near-Me search.

We deliberately avoid PostGIS so the same code path runs on SQLite-in-memory
tests and Postgres production. A bounding-box prefilter narrows candidates in
SQL; precise Haversine refinement happens in Python.
"""
from __future__ import annotations

import math

EARTH_RADIUS_KM = 6371.0088


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometers between two WGS84 points."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c


def bounding_box(lat: float, lon: float, radius_km: float) -> tuple[float, float, float, float]:
    """Cheap lat/lng bounds for a SQL prefilter.

    Returns ``(min_lat, max_lat, min_lon, max_lon)``. The longitude delta widens
    near the poles via ``cos(lat)``; we clamp ``cos`` to a small floor so we do
    not blow up at ``±90°``.
    """
    lat_delta = radius_km / 111.0  # 1° lat ~= 111 km
    cos_lat = max(math.cos(math.radians(lat)), 1e-6)
    lon_delta = radius_km / (111.0 * cos_lat)

    return (
        lat - lat_delta,
        lat + lat_delta,
        lon - lon_delta,
        lon + lon_delta,
    )
