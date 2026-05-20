"""Pydantic schemas for certificate data transfer and validation."""

from pydantic import BaseModel, field_validator
from datetime import datetime
from uuid import UUID
import re


class CertificateRead(BaseModel):
    """Response schema for certificate data enrichment."""
    
    donation_id: UUID
    donor_name: str
    amount: float
    asset: str
    date: datetime
    tx_id: str
    blockchain_confirmed: bool
    campaign_title: str
    campaign_institution: str
    milestone_status: str
    merkle_proof: str | None = None
    
    @field_validator("tx_id")
    @classmethod
    def validate_stellar_tx_hash(cls, v: str) -> str:
        """Validate Stellar transaction hash format: 64 lowercase hex chars, no prefix."""
        if not v:
            raise ValueError("Transaction hash cannot be empty")
        
        if v.lower().startswith("0x"):
            raise ValueError(
                "Stellar tx hashes must not have '0x' prefix. "
                "Expected: 64 lowercase hexadecimal characters."
            )
        
        if not re.match(r"^[a-f0-9]{64}$", v.lower()):
            raise ValueError(
                "Invalid Stellar tx hash format. "
                "Expected exactly 64 lowercase hexadecimal characters."
            )
        
        return v
    
    model_config = {"from_attributes": True}
