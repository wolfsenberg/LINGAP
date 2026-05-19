import uuid
import enum
from datetime import datetime
from sqlalchemy import String, ForeignKey, Numeric, BigInteger, Text, Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from .mixins import TimestampMixin


class ProofKind(str, enum.Enum):
    receipt = "receipt"
    invoice = "invoice"
    document = "document"
    photo = "photo"
    other = "other"


class ProofArtifact(Base, TimestampMixin):
    __tablename__ = "proof_artifacts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    aid_request_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("aid_requests.id"), index=True
    )
    uploader_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    kind: Mapped[ProofKind] = mapped_column(
        Enum(ProofKind), default=ProofKind.receipt, index=True
    )
    filename: Mapped[str] = mapped_column(String(512))
    stored_path: Mapped[str] = mapped_column(String(1024))
    mime: Mapped[str] = mapped_column(String(128))
    size_bytes: Mapped[int] = mapped_column(BigInteger)
    sha256: Mapped[str] = mapped_column(String(64), index=True)
    claimed_amount: Mapped[float | None] = mapped_column(Numeric(18, 7))
    description: Mapped[str | None] = mapped_column(Text)
    stellar_anchor_tx: Mapped[str | None] = mapped_column(String(64))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
