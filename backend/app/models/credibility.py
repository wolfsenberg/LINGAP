"""Beneficiary credibility scoring snapshots.

Mirrors the ``RiskAssessment`` pattern: a history table of scoring runs plus
cached columns on ``Beneficiary``. The deterministic engine version stays
small so reviewers can audit changes quickly.
"""
from __future__ import annotations

import enum
import uuid

from sqlalchemy import JSON, Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

from .mixins import TimestampMixin


class CredibilityTier(str, enum.Enum):
    new = "new"
    building = "building"
    trusted = "trusted"
    verified_partner = "verified_partner"


class CredibilityAssessment(Base, TimestampMixin):
    """One snapshot of a beneficiary's credibility score."""

    __tablename__ = "credibility_assessments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    beneficiary_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("beneficiaries.id"), index=True
    )
    score: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    tier: Mapped[CredibilityTier] = mapped_column(
        Enum(CredibilityTier), default=CredibilityTier.new
    )
    breakdown: Mapped[dict] = mapped_column(JSON, default=dict)
    engine_version: Mapped[str] = mapped_column(String(32), default="v1")
    inputs_hash: Mapped[str] = mapped_column(String(64), index=True)
