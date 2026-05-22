import uuid

from sqlalchemy import ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from .mixins import TimestampMixin


class CampaignDriveChange(Base, TimestampMixin):
    __tablename__ = "campaign_drive_changes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campaign_drives.id"), index=True)
    actor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    changed_fields: Mapped[list[str]] = mapped_column(JSON, default=list)
    changes: Mapped[dict] = mapped_column(JSON, default=dict)
    summary: Mapped[str] = mapped_column(String(500))

    campaign: Mapped["CampaignDrive"] = relationship("CampaignDrive")  # noqa: F821
    actor: Mapped["User"] = relationship("User")  # noqa: F821
