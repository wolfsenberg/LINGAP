import uuid
from sqlalchemy import String, Numeric, ForeignKey, BigInteger, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from .mixins import TimestampMixin


class ProvenanceRecord(Base, TimestampMixin):
    __tablename__ = "provenance_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    donation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("donations.id"))
    aid_request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("aid_requests.id"))
    beneficiary_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("beneficiaries.id"))
    amount: Mapped[float] = mapped_column(Numeric(18, 7))
    asset: Mapped[str] = mapped_column(String(12))
    contract_address: Mapped[str] = mapped_column(String(56))
    stellar_tx_hash: Mapped[str] = mapped_column(String(64), index=True)
    ledger: Mapped[int] = mapped_column(BigInteger)
    merkle_proof: Mapped[str | None] = mapped_column(
        String(512),
        index=True,
        nullable=True,
        doc="Soroban contract merkle proof for on-chain verification"
    )

    donation: Mapped["Donation"] = relationship(back_populates="provenance_records")  # noqa: F821
