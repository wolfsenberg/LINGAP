import uuid
from sqlalchemy import String, Boolean, ForeignKey, Numeric, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from .mixins import TimestampMixin


class DonationCertificate(Base, TimestampMixin):
    __tablename__ = "donation_certificates"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    donation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("donations.id"), unique=True, index=True
    )
    s3_url: Mapped[str] = mapped_column(String(1024))
    svg_s3_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    pdf_hash: Mapped[str] = mapped_column(String(64), index=True)
    svg_hash: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)

    donor_name: Mapped[str] = mapped_column(String(255))
    amount: Mapped[float] = mapped_column(Numeric(18, 7))
    beneficiary_name: Mapped[str] = mapped_column(String(255))
    milestone_description: Mapped[str] = mapped_column(Text)
    lives_touched: Mapped[int] = mapped_column(Integer, default=0)
    total_donated: Mapped[float] = mapped_column(Numeric(18, 7))

    stellar_tx_hash: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    merkle_proof: Mapped[str | None] = mapped_column(Text, nullable=True)
    onchain_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)

    donation: Mapped["Donation"] = relationship(back_populates="certificate")  # noqa: F821
