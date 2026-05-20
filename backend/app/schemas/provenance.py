"""Updated ProvenanceRecord Pydantic schema with merkle_proof field."""

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class ProvenanceRecordRead(BaseModel):
    """Serialization schema for provenance records with merkle proof support."""
    
    id: UUID
    donation_id: UUID
    aid_request_id: UUID
    beneficiary_id: UUID
    amount: float
    asset: str
    contract_address: str
    stellar_tx_hash: str
    ledger: int
    merkle_proof: str | None = None
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}
