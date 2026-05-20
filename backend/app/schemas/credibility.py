"""Pydantic schemas for the credibility API."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.credibility import CredibilityTier


class CredibilityRead(BaseModel):
    beneficiary_id: UUID
    score: float | None
    tier: CredibilityTier | None
    breakdown: dict
    recomputed_at: datetime | None


class CredibilityAssessmentRead(BaseModel):
    id: UUID
    beneficiary_id: UUID
    score: float
    tier: CredibilityTier
    breakdown: dict
    engine_version: str
    inputs_hash: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CredibilityHistory(BaseModel):
    items: list[CredibilityAssessmentRead]
    total: int
