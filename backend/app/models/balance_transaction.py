import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from .mixins import TimestampMixin


class BalanceTransactionKind(str, enum.Enum):
    top_up = "top_up"
    donation = "donation"


class BalancePaymentMethod(str, enum.Enum):
    pdax = "pdax"
    gcash = "gcash"
    maya = "maya"
    stellar_wallet = "stellar_wallet"
    lingap_balance = "lingap_balance"


class BalancePaymentStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    failed = "failed"


class BalanceTransaction(Base, TimestampMixin):
    __tablename__ = "balance_transactions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    kind: Mapped[BalanceTransactionKind] = mapped_column(Enum(BalanceTransactionKind), index=True)
    amount_xlm: Mapped[float] = mapped_column(Numeric(18, 7))
    amount_php: Mapped[float] = mapped_column(Numeric(18, 2))
    payment_method: Mapped[BalancePaymentMethod] = mapped_column(Enum(BalancePaymentMethod), index=True)
    payment_reference: Mapped[str] = mapped_column(String(96), index=True)
    payment_status: Mapped[BalancePaymentStatus] = mapped_column(
        Enum(BalancePaymentStatus), default=BalancePaymentStatus.pending, index=True
    )
    campaign_id: Mapped[str | None] = mapped_column(String(128), index=True)
    donation_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("donations.id"), index=True)
    stellar_tx_hash: Mapped[str | None] = mapped_column(String(128), index=True)
    note: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship("User")  # noqa: F821
    donation: Mapped["Donation"] = relationship("Donation")  # noqa: F821
