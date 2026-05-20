import uuid
from sqlalchemy import String, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from .mixins import TimestampMixin


class DonorVote(Base, TimestampMixin):
    __tablename__ = "donor_votes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[int] = mapped_column(Integer, index=True)
    voter_address: Mapped[str] = mapped_column(String(64), index=True)
    tx_hash: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
