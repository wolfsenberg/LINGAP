from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class DonationCertificateCreate(BaseModel):
    donor_name: str
    amount: float
    beneficiary_name: str
    milestone_description: str
    lives_touched: int
    total_donated: float


class DonationCertificateRead(BaseModel):
    id: UUID
    donation_id: UUID
    s3_url: str
    is_public: bool
    donor_name: str
    amount: float
    beneficiary_name: str
    milestone_description: str
    lives_touched: int
    total_donated: float
    created_at: datetime

    model_config = {"from_attributes": True}


class DonationCertificateUpdate(BaseModel):
    is_public: bool
