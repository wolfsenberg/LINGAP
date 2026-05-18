from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from app.models.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: UserRole = UserRole.donor
    stellar_public_key: str | None = None


class UserRead(BaseModel):
    id: UUID
    email: str
    name: str
    role: UserRole
    stellar_public_key: str | None
    kyc_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    token: str
    user: UserRead
