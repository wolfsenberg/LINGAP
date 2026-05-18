import uuid
from sqlalchemy import String, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from .mixins import TimestampMixin
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    donor = "donor"
    beneficiary = "beneficiary"
    aid_worker = "aid_worker"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.donor)
    stellar_public_key: Mapped[str | None] = mapped_column(String(56))
    kyc_verified: Mapped[bool] = mapped_column(Boolean, default=False)
