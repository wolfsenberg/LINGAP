from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime
import re


class DonationCreate(BaseModel):
    amount: float
    asset: str = "XLM"
    purpose: str | None = None
    stellar_tx_hash: str
    
    @field_validator("stellar_tx_hash")
    @classmethod
    def validate_stellar_tx_hash(cls, v: str) -> str:
        """Enforce Stellar native tx format: 64 lowercase hex chars, no '0x' prefix."""
        if not v:
            raise ValueError("Stellar transaction hash is required")
        
        v_lower = v.lower()
        
        if v_lower.startswith("0x") or v_lower.startswith("0x"):
            raise ValueError(
                "Stellar tx hashes must not have '0x' prefix. "
                "Use 64 lowercase hexadecimal characters."
            )
        
        if not re.match(r"^[a-f0-9]{64}$", v_lower):
            raise ValueError(
                "Invalid Stellar tx hash format. "
                "Expected exactly 64 lowercase hexadecimal characters (e.g., "
                "8b7d6b8a9c1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f)"
            )
        
        return v


class DonationRead(BaseModel):
    id: UUID
    donor_id: UUID
    donor_name: str
    amount: float
    asset: str
    purpose: str | None
    stellar_tx_hash: str
    blockchain_confirmed: bool
    disbursed: bool
    disbursed_amount: float
    created_at: datetime

    model_config = {"from_attributes": True}
