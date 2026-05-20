import uuid
import enum
from sqlalchemy import String, Text, Integer, ForeignKey, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from .mixins import TimestampMixin


class VolunteerCategory(str, enum.Enum):
    medical = "medical"
    legal = "legal"
    tech = "tech"
    logistics = "logistics"
    teaching = "teaching"
    counseling = "counseling"
    construction = "construction"
    other = "other"


class OpportunityStatus(str, enum.Enum):
    open = "open"
    filled = "filled"
    closed = "closed"


class SignupStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class VolunteerOpportunity(Base, TimestampMixin):
    __tablename__ = "volunteer_opportunities"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organizer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    campaign_name: Mapped[str] = mapped_column(String(255))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[VolunteerCategory] = mapped_column(Enum(VolunteerCategory), default=VolunteerCategory.other)
    skills_needed: Mapped[str] = mapped_column(Text, default="")  # comma-separated
    location: Mapped[str] = mapped_column(String(255))
    schedule: Mapped[str] = mapped_column(String(255))  # e.g. "Dec 5, 2025 · 8AM–4PM"
    slots: Mapped[int] = mapped_column(Integer, default=1)
    slots_filled: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[OpportunityStatus] = mapped_column(Enum(OpportunityStatus), default=OpportunityStatus.open)
    urgent: Mapped[bool] = mapped_column(Boolean, default=False)

    organizer: Mapped["User"] = relationship("User", foreign_keys=[organizer_id])  # noqa: F821
    signups: Mapped[list["VolunteerSignup"]] = relationship(back_populates="opportunity", cascade="all, delete-orphan")


class VolunteerSignup(Base, TimestampMixin):
    __tablename__ = "volunteer_signups"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    opportunity_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("volunteer_opportunities.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    message: Mapped[str] = mapped_column(Text, default="")
    skills: Mapped[str] = mapped_column(Text, default="")  # comma-separated
    status: Mapped[SignupStatus] = mapped_column(Enum(SignupStatus), default=SignupStatus.pending)

    opportunity: Mapped["VolunteerOpportunity"] = relationship(back_populates="signups")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])  # noqa: F821
