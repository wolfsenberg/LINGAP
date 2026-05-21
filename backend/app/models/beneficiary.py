import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, Enum, Numeric, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from .mixins import TimestampMixin
import enum
from .credibility import CredibilityTier


class BeneficiaryCategory(str, enum.Enum):
    individual = "individual"
    family = "family"
    community = "community"
    organization = "organization"


class NeedLevel(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class Beneficiary(Base, TimestampMixin):
    __tablename__ = "beneficiaries"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    national_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    location: Mapped[str] = mapped_column(String(512))
    category: Mapped[BeneficiaryCategory] = mapped_column(
        Enum(BeneficiaryCategory), default=BeneficiaryCategory.individual
    )
    need_level: Mapped[NeedLevel] = mapped_column(Enum(NeedLevel), default=NeedLevel.medium)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    stellar_public_key: Mapped[str | None] = mapped_column(String(56))
    total_received: Mapped[float] = mapped_column(Numeric(18, 7), default=0)
    cached_credibility_score: Mapped[float | None] = mapped_column(Numeric(5, 2))
    cached_credibility_tier: Mapped[CredibilityTier | None] = mapped_column(
        Enum(CredibilityTier)
    )
    credibility_recomputed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
    latitude: Mapped[float | None] = mapped_column(Numeric(10, 7))
    longitude: Mapped[float | None] = mapped_column(Numeric(10, 7))

    aid_requests: Mapped[list["AidRequest"]] = relationship(back_populates="beneficiary")  # noqa: F821
