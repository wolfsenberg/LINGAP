import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from .mixins import TimestampMixin


class CampaignDriveStatus(str, enum.Enum):
    draft = "Draft"
    under_review = "Under Review"
    active = "Active"
    funded = "Funded"


class CampaignDrive(Base, TimestampMixin):
    __tablename__ = "campaign_drives"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organizer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(64))
    institution: Mapped[str] = mapped_column(String(255))
    location: Mapped[str] = mapped_column(String(255))
    goal_amount: Mapped[float] = mapped_column(Numeric(18, 7))
    raised_amount: Mapped[float] = mapped_column(Numeric(18, 7), default=0)
    donors: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[CampaignDriveStatus] = mapped_column(
        Enum(CampaignDriveStatus), default=CampaignDriveStatus.under_review, index=True
    )
    image_src: Mapped[str | None] = mapped_column(String(512))

    organizer: Mapped["User"] = relationship("User")  # noqa: F821
