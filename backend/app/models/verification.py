from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String
import uuid
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from app.core.database import Base

class Verification(Base):
    __tablename__ = "verification"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    aid_request_id: Mapped[uuid.UUID] = mapped_column(PGUUID, ForeignKey("aid_requests.id"), unique=True, index=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    credibility_score: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_checked: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # relationship back‑ref
    aid_request = relationship("AidRequest", back_populates="verification")
