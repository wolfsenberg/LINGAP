from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class DonationCreate(BaseModel):
    amount: float
    asset: str = "XLM"
    purpose: str | None = None
    stellar_tx_hash: str | None = None
    funding_source: str | None = None
    spend_balance: bool = False
    wallet_address: str | None = None


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
    funding_source: str | None = None
    amount_php: float | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
