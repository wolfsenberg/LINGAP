from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.progress_update import ProgressStatus, VerifyDecision


class ProgressCreate(BaseModel):
    status: ProgressStatus = ProgressStatus.in_progress
    note: str = Field(min_length=1)
    proof_ids: list[UUID] = Field(default_factory=list)


class VerifierConfirmationRead(BaseModel):
    id: UUID
    verifier_id: UUID
    decision: VerifyDecision
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProgressUpdateRead(BaseModel):
    id: UUID
    aid_request_id: UUID
    author_id: UUID
    status: ProgressStatus
    note: str
    proof_ids: list[UUID]
    confirmations: list[VerifierConfirmationRead] = Field(default_factory=list)
    created_at: datetime

    model_config = {"from_attributes": True}


class VerifyRequest(BaseModel):
    decision: VerifyDecision = VerifyDecision.confirmed
    notes: str | None = None
