import uuid
from sqlalchemy import String, Numeric, ForeignKey, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from .mixins import TimestampMixin
import enum


class AidRequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    disbursed = "disbursed"
    rejected = "rejected"


class AidRequest(Base, TimestampMixin):
    __tablename__ = "aid_requests"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    beneficiary_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("beneficiaries.id"))
    requested_amount: Mapped[float] = mapped_column(Numeric(18, 7))
    asset: Mapped[str] = mapped_column(String(12), default="XLM")
    purpose: Mapped[str] = mapped_column(Text)
    status: Mapped[AidRequestStatus] = mapped_column(
        Enum(AidRequestStatus), default=AidRequestStatus.pending, index=True
    )
    stellar_tx_hash: Mapped[str | None] = mapped_column(String(64))
    approved_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    rejection_reason: Mapped[str | None] = mapped_column(Text)

    beneficiary: Mapped["Beneficiary"] = relationship(back_populates="aid_requests")  # noqa: F821
    approver: Mapped["User | None"] = relationship("User", foreign_keys=[approved_by])  # noqa: F821
