import uuid
import enum
from sqlalchemy import JSON, ForeignKey, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from .mixins import TimestampMixin


class ProgressStatus(str, enum.Enum):
    planned = "planned"
    in_progress = "in_progress"
    delivered = "delivered"
    blocked = "blocked"


class ProgressUpdate(Base, TimestampMixin):
    """Organizer- or aid-worker-authored progress notes on an aid request.

    ``proof_ids`` is stored as JSON to keep the schema portable across
    Postgres and sqlite (used by the test harness). Each id should reference
    a row in ``proof_artifacts`` belonging to the same ``aid_request_id``.
    """

    __tablename__ = "progress_updates"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    aid_request_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("aid_requests.id"), index=True
    )
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    status: Mapped[ProgressStatus] = mapped_column(
        Enum(ProgressStatus), default=ProgressStatus.in_progress
    )
    note: Mapped[str] = mapped_column(Text)
    proof_ids: Mapped[list] = mapped_column(JSON, default=list)


class VerifyDecision(str, enum.Enum):
    confirmed = "confirmed"
    disputed = "disputed"


class VerifierConfirmation(Base, TimestampMixin):
    __tablename__ = "verifier_confirmations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    progress_update_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("progress_updates.id"), index=True
    )
    verifier_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    decision: Mapped[VerifyDecision] = mapped_column(
        Enum(VerifyDecision), default=VerifyDecision.confirmed
    )
    notes: Mapped[str | None] = mapped_column(Text)
