from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class TopUpSimulateCreate(BaseModel):
    amount_xlm: float | None = Field(default=None, gt=0)
    amount_php: float | None = Field(default=None, gt=0)
    payment_method: str


class BalanceTransactionRead(BaseModel):
    id: UUID
    kind: str
    amount_xlm: float
    amount_php: float
    payment_method: str
    payment_reference: str
    payment_status: str
    campaign_id: str | None = None
    donation_id: UUID | None = None
    stellar_tx_hash: str | None = None
    note: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BalanceRead(BaseModel):
    xlm_balance: float
    php_equivalent: float
    xlm_to_php_rate: float
    transactions: list[BalanceTransactionRead]
