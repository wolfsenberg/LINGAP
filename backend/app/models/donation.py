import uuid
from sqlalchemy import String, Boolean, Numeric, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from .mixins import TimestampMixin


class Donation(Base, TimestampMixin):
    __tablename__ = "donations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    donor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    amount: Mapped[float] = mapped_column(Numeric(18, 7))
    asset: Mapped[str] = mapped_column(String(12), default="XLM")
    purpose: Mapped[str | None] = mapped_column(Text)
    stellar_tx_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    blockchain_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    disbursed: Mapped[bool] = mapped_column(Boolean, default=False)
    disbursed_amount: Mapped[float] = mapped_column(Numeric(18, 7), default=0)

    donor: Mapped["User"] = relationship("User", foreign_keys=[donor_id])  # noqa: F821
    provenance_records: Mapped[list["ProvenanceRecord"]] = relationship(back_populates="donation")  # noqa: F821
    certificate: Mapped["DonationCertificate"] = relationship(back_populates="donation", uselist=False, cascade="all, delete-orphan")  # noqa: F821
