import uuid
import enum
from sqlalchemy import JSON, ForeignKey, Numeric, String, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from .mixins import TimestampMixin
from .aid_request import RiskLevel


class RiskEngineKind(str, enum.Enum):
    llm = "llm"
    rules = "rules"


class RiskAssessment(Base, TimestampMixin):
    """One run of the risk engine against an aid request."""

    __tablename__ = "risk_assessments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    aid_request_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("aid_requests.id"), index=True
    )
    engine: Mapped[RiskEngineKind] = mapped_column(
        Enum(RiskEngineKind), default=RiskEngineKind.rules
    )
    score: Mapped[float] = mapped_column(Numeric(6, 2), default=0)
    level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel), default=RiskLevel.low)
    flags: Mapped[list] = mapped_column(JSON, default=list)
    reasoning: Mapped[str | None] = mapped_column(Text)
    model_version: Mapped[str | None] = mapped_column(String(128))
    inputs_hash: Mapped[str] = mapped_column(String(64), index=True)


class SpendingComparison(Base, TimestampMixin):
    __tablename__ = "spending_comparisons"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    aid_request_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("aid_requests.id"), index=True
    )
    requested_amount: Mapped[float] = mapped_column(Numeric(18, 7))
    claimed_total: Mapped[float] = mapped_column(Numeric(18, 7), default=0)
    variance_pct: Mapped[float] = mapped_column(Numeric(8, 4), default=0)
    breakdown: Mapped[dict] = mapped_column(JSON, default=dict)


class FlagSource(str, enum.Enum):
    rule = "rule"
    llm = "llm"
    user = "user"


class FlagSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class FlagStatus(str, enum.Enum):
    open = "open"
    dismissed = "dismissed"
    escalated = "escalated"
    confirmed = "confirmed"


class ScamFlag(Base, TimestampMixin):
    __tablename__ = "scam_flags"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    aid_request_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("aid_requests.id"), index=True
    )
    source: Mapped[FlagSource] = mapped_column(Enum(FlagSource), default=FlagSource.rule)
    severity: Mapped[FlagSeverity] = mapped_column(
        Enum(FlagSeverity), default=FlagSeverity.medium, index=True
    )
    flag_type: Mapped[str] = mapped_column(String(128))
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[FlagStatus] = mapped_column(
        Enum(FlagStatus), default=FlagStatus.open, index=True
    )
    reviewer_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    resolution_note: Mapped[str | None] = mapped_column(Text)
