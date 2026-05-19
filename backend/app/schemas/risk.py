from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.aid_request import RiskLevel
from app.models.risk import (
    FlagSeverity,
    FlagSource,
    FlagStatus,
    RiskEngineKind,
)


class RiskAssessmentRead(BaseModel):
    id: UUID
    aid_request_id: UUID
    engine: RiskEngineKind
    score: float
    level: RiskLevel
    flags: list[dict]
    reasoning: str | None
    model_version: str | None
    inputs_hash: str
    created_at: datetime

    model_config = {"from_attributes": True, "protected_namespaces": ()}


class SpendingComparisonRead(BaseModel):
    id: UUID
    aid_request_id: UUID
    requested_amount: float
    claimed_total: float
    variance_pct: float
    breakdown: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class ScamFlagRead(BaseModel):
    id: UUID
    aid_request_id: UUID
    source: FlagSource
    severity: FlagSeverity
    flag_type: str
    details: dict
    status: FlagStatus
    reviewer_id: UUID | None
    resolution_note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ScamFlagPatch(BaseModel):
    status: FlagStatus
    resolution_note: str | None = None
