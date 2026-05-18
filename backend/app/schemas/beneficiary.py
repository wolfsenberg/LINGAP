from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from app.models.beneficiary import BeneficiaryCategory, NeedLevel


class BeneficiaryCreate(BaseModel):
    name: str
    national_id: str
    location: str
    category: BeneficiaryCategory = BeneficiaryCategory.individual
    need_level: NeedLevel = NeedLevel.medium
    stellar_public_key: str | None = None


class BeneficiaryRead(BaseModel):
    id: UUID
    name: str
    national_id: str
    location: str
    category: BeneficiaryCategory
    need_level: NeedLevel
    verified: bool
    stellar_public_key: str | None
    total_received: float
    created_at: datetime

    model_config = {"from_attributes": True}
