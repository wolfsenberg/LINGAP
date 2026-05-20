from pydantic import BaseModel, Field
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
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class BeneficiaryUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    category: BeneficiaryCategory | None = None
    need_level: NeedLevel | None = None
    stellar_public_key: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


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
    latitude: float | None = None
    longitude: float | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
