from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from app.models.aid_request import AidRequestStatus


class AidRequestCreate(BaseModel):
    beneficiary_id: UUID
    requested_amount: float
    asset: str = "XLM"
    purpose: str


class AidRequestRead(BaseModel):
    id: UUID
    beneficiary_id: UUID
    beneficiary_name: str
    requested_amount: float
    asset: str
    purpose: str
    status: AidRequestStatus
    stellar_tx_hash: str | None
    approved_by: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RejectRequest(BaseModel):
    reason: str
