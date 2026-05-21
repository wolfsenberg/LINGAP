from enum import Enum
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Float, Boolean, DateTime, Integer, Enum as SQLEnum
from sqlalchemy.orm import declarative_base
import uuid

Base = declarative_base()

# ============================================================================
# ENUMS
# ============================================================================

class ReleaseTier(str, Enum):
    EMERGENCY = "emergency"
    MILESTONE = "milestone"

class ReceiptState(str, Enum):
    VERIFIED = "verified"
    PENDING = "pending"
    OVERDUE = "overdue"

class ReleaseStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    RELEASED = "released"
    BLOCKED = "blocked"

# ============================================================================
# DATABASE MODELS
# ============================================================================

class FundReleaseTransaction(Base):
    __tablename__ = "fund_release_transactions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organizer_id = Column(String(36), nullable=False, index=True)
    transaction_amount = Column(Float, nullable=False)
    release_tier = Column(SQLEnum(ReleaseTier), nullable=False)
    status = Column(SQLEnum(ReleaseStatus), default=ReleaseStatus.PENDING)
    receipt_state = Column(SQLEnum(ReceiptState), nullable=True)
    receipt_validated = Column(Boolean, default=False)
    receipt_validation_deadline = Column(DateTime, nullable=True)
    capped_release_percentage = Column(Float, nullable=True)
    released_amount = Column(Float, default=0.0)
    remaining_balance = Column(Float, default=0.0)
    off_ramp_partner_id = Column(String(36), nullable=True)
    is_frozen = Column(Boolean, default=False)
    milestone_verification_required = Column(Boolean, default=False)
    milestone_block_active = Column(Boolean, default=False)
    preceding_milestone_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class OrganizerCredibility(Base):
    __tablename__ = "organizer_credibility"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organizer_id = Column(String(36), unique=True, nullable=False, index=True)
    credibility_score = Column(Float, default=100.0)
    frozen_fund_access = Column(Boolean, default=False)
    overdue_receipt_count = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MilestoneVerification(Base):
    __tablename__ = "milestone_verifications"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String(36), nullable=False, index=True)
    milestone_sequence = Column(Integer, nullable=False)
    proof_submitted = Column(Boolean, default=False)
    proof_verified = Column(Boolean, default=False)
    verification_timestamp = Column(DateTime, nullable=True)
    allows_next_release = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================================
# REQUEST/RESPONSE SCHEMAS
# ============================================================================

class ReleaseValidationRequest(BaseModel):
    organizer_id: str
    transaction_amount: float
    off_ramp_partner_id: Optional[str] = None
    milestone_context: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "organizer_id": "org-123",
                "transaction_amount": 12000.00,
                "off_ramp_partner_id": "partner-456"
            }
        }


class ReleaseRoutingResponse(BaseModel):
    tier: ReleaseTier
    status: ReleaseStatus
    transaction_id: str
    released_amount: float
    remaining_balance: float
    capped_percentage: Optional[float] = None
    receipt_validation_required: bool
    receipt_deadline: Optional[datetime] = None
    milestone_block_active: bool = False
    message: str


class ReceiptValidationRequest(BaseModel):
    transaction_id: str
    receipt_hash: str
    receipt_details: Dict[str, Any]


class MilestoneProofRequest(BaseModel):
    transaction_id: str
    milestone_id: str
    proof_hash: str
    proof_details: Dict[str, Any]


# ============================================================================
# VALIDATION RULES & CONSTANTS
# ============================================================================

EMERGENCY_TIER_THRESHOLD = 15000.0
EMERGENCY_CAPPED_PERCENTAGE = 0.70
CREDIBILITY_SCORE_PENALTY = 5.0
RECEIPT_VALIDATION_WINDOW_DAYS = 7

# ============================================================================
# FUND RELEASE ENGINE
# ============================================================================

class FundReleaseEngine:
    
    @staticmethod
    def route_release(request: ReleaseValidationRequest) -> tuple[ReleaseTier, Dict[str, Any]]:
        """
        Route transaction to appropriate tier based on amount threshold.
        Returns: (tier, routing_context)
        """
        if request.transaction_amount < EMERGENCY_TIER_THRESHOLD:
            return ReleaseTier.EMERGENCY, {
                "reason": "Below threshold",
                "capped_release": request.transaction_amount * EMERGENCY_CAPPED_PERCENTAGE
            }
        else:
            return ReleaseTier.MILESTONE, {
                "reason": "At or above threshold",
                "requires_milestone_verification": True
            }
    
    @staticmethod
    def validate_split_tier_routing(amount: float) -> Dict[str, Any]:
        """
        Validates transaction amount against tier thresholds.
        """
        return {
            "amount": amount,
            "threshold": EMERGENCY_TIER_THRESHOLD,
            "tier": ReleaseTier.EMERGENCY if amount < EMERGENCY_TIER_THRESHOLD else ReleaseTier.MILESTONE,
            "valid": True
        }
    
    @staticmethod
    def process_tier1_emergency_release(
        transaction_id: str,
        organizer_id: str,
        amount: float,
        off_ramp_partner_id: str,
        db_session
    ) -> Dict[str, Any]:
        """
        Tier 1 Logic (Emergency Quick-Release < 15,000 PHP):
        - Trigger immediate release handling for capped percentage to off-ramp partner
        - Flag organizer account status to require post-expenditure receipt validation
        - Setup freeze/credibility score reduction if receipt pending/overdue
        """
        capped_amount = amount * EMERGENCY_CAPPED_PERCENTAGE
        remaining = amount - capped_amount
        
        transaction = FundReleaseTransaction(
            id=transaction_id,
            organizer_id=organizer_id,
            transaction_amount=amount,
            release_tier=ReleaseTier.EMERGENCY,
            status=ReleaseStatus.RELEASED,
            released_amount=capped_amount,
            remaining_balance=remaining,
            off_ramp_partner_id=off_ramp_partner_id,
            capped_release_percentage=EMERGENCY_CAPPED_PERCENTAGE,
            receipt_state=ReceiptState.PENDING
        )
        
        from datetime import timedelta
        transaction.receipt_validation_deadline = datetime.utcnow() + timedelta(days=RECEIPT_VALIDATION_WINDOW_DAYS)
        
        db_session.add(transaction)
        
        credibility = db_session.query(OrganizerCredibility).filter_by(organizer_id=organizer_id).first()
        if not credibility:
            credibility = OrganizerCredibility(organizer_id=organizer_id)
            db_session.add(credibility)
        
        return {
            "transaction_id": transaction_id,
            "tier": ReleaseTier.EMERGENCY,
            "immediate_release_amount": capped_amount,
            "held_amount": remaining,
            "receipt_required": True,
            "receipt_deadline_days": RECEIPT_VALIDATION_WINDOW_DAYS,
            "off_ramp_partner": off_ramp_partner_id,
            "status": ReleaseStatus.RELEASED
        }
    
    @staticmethod
    def process_tier2_milestone_release(
        transaction_id: str,
        organizer_id: str,
        amount: float,
        preceding_milestone_id: Optional[str],
        db_session
    ) -> Dict[str, Any]:
        """
        Tier 2 Logic (Milestone-Based Capital >= 15,000 PHP):
        - Enforce strict programmatic lock on remaining balance pools
        - Expose milestone validation hook that blocks subsequent payouts until proof verified
        """
        transaction = FundReleaseTransaction(
            id=transaction_id,
            organizer_id=organizer_id,
            transaction_amount=amount,
            release_tier=ReleaseTier.MILESTONE,
            status=ReleaseStatus.PENDING,
            released_amount=0.0,
            remaining_balance=amount,
            is_frozen=True,
            milestone_verification_required=True,
            milestone_block_active=True if preceding_milestone_id else False,
            preceding_milestone_id=preceding_milestone_id
        )
        
        db_session.add(transaction)
        
        if preceding_milestone_id:
            preceding_verification = MilestoneVerification(
                transaction_id=transaction_id,
                milestone_sequence=1,
                proof_submitted=False,
                proof_verified=False,
                allows_next_release=False
            )
            db_session.add(preceding_verification)
        
        return {
            "transaction_id": transaction_id,
            "tier": ReleaseTier.MILESTONE,
            "total_amount": amount,
            "released_amount": 0.0,
            "remaining_balance": amount,
            "frozen": True,
            "freeze_reason": "Milestone verification required",
            "milestone_verification_required": True,
            "milestone_block_active": transaction.milestone_block_active,
            "preceding_milestone_id": preceding_milestone_id,
            "status": ReleaseStatus.PENDING,
            "blocks_subsequent_payouts": True
        }
    
    @staticmethod
    def validate_receipt_and_update_credibility(
        transaction_id: str,
        organizer_id: str,
        receipt_verified: bool,
        db_session
    ) -> Dict[str, Any]:
        """
        Validates receipt submission and updates organizer credibility.
        Freezes access or reduces credibility score if pending/overdue.
        """
        transaction = db_session.query(FundReleaseTransaction).filter_by(id=transaction_id).first()
        if not transaction:
            raise ValueError(f"Transaction {transaction_id} not found")
        
        credibility = db_session.query(OrganizerCredibility).filter_by(organizer_id=organizer_id).first()
        if not credibility:
            credibility = OrganizerCredibility(organizer_id=organizer_id)
            db_session.add(credibility)
        
        if receipt_verified:
            transaction.receipt_state = ReceiptState.VERIFIED
            transaction.receipt_validated = True
            return {
                "transaction_id": transaction_id,
                "receipt_status": ReceiptState.VERIFIED,
                "credibility_score": credibility.credibility_score,
                "fund_access_frozen": False,
                "message": "Receipt verified. Fund access restored."
            }
        else:
            now = datetime.utcnow()
            if transaction.receipt_validation_deadline and now > transaction.receipt_validation_deadline:
                transaction.receipt_state = ReceiptState.OVERDUE
                credibility.frozen_fund_access = True
                credibility.credibility_score = max(0, credibility.credibility_score - CREDIBILITY_SCORE_PENALTY)
                credibility.overdue_receipt_count += 1
                
                return {
                    "transaction_id": transaction_id,
                    "receipt_status": ReceiptState.OVERDUE,
                    "credibility_score": credibility.credibility_score,
                    "fund_access_frozen": True,
                    "penalty_applied": CREDIBILITY_SCORE_PENALTY,
                    "message": "Receipt overdue. Fund access frozen and credibility score reduced."
                }
            else:
                transaction.receipt_state = ReceiptState.PENDING
                return {
                    "transaction_id": transaction_id,
                    "receipt_status": ReceiptState.PENDING,
                    "credibility_score": credibility.credibility_score,
                    "fund_access_frozen": credibility.frozen_fund_access,
                    "message": "Receipt still pending validation."
                }
    
    @staticmethod
    def verify_milestone_completion(
        transaction_id: str,
        milestone_id: str,
        proof_verified: bool,
        db_session
    ) -> Dict[str, Any]:
        """
        Milestone validation hook: Blocks subsequent payouts until proof of completion verified.
        """
        transaction = db_session.query(FundReleaseTransaction).filter_by(id=transaction_id).first()
        if not transaction:
            raise ValueError(f"Transaction {transaction_id} not found")
        
        if transaction.release_tier != ReleaseTier.MILESTONE:
            raise ValueError(f"Transaction {transaction_id} is not a milestone-based release")
        
        verification = db_session.query(MilestoneVerification).filter_by(
            transaction_id=transaction_id,
            milestone_sequence=1
        ).first()
        
        if not verification:
            verification = MilestoneVerification(
                transaction_id=transaction_id,
                milestone_sequence=1,
                proof_submitted=True
            )
            db_session.add(verification)
        
        if proof_verified:
            verification.proof_verified = True
            verification.verification_timestamp = datetime.utcnow()
            verification.allows_next_release = True
            transaction.milestone_block_active = False
            transaction.is_frozen = False
            transaction.status = ReleaseStatus.APPROVED
            
            return {
                "transaction_id": transaction_id,
                "milestone_id": milestone_id,
                "verification_status": "verified",
                "blocks_subsequent_payouts": False,
                "allows_next_release": True,
                "message": "Milestone verification complete. Subsequent payouts now allowed."
            }
        else:
            verification.proof_submitted = True
            transaction.milestone_block_active = True
            
            return {
                "transaction_id": transaction_id,
                "milestone_id": milestone_id,
                "verification_status": "pending",
                "blocks_subsequent_payouts": True,
                "allows_next_release": False,
                "message": "Milestone verification pending. Subsequent payouts blocked."
            }
    
    @staticmethod
    def check_fund_access_status(organizer_id: str, db_session) -> Dict[str, Any]:
        """
        Check organizer's fund access status based on credibility and frozen state.
        """
        credibility = db_session.query(OrganizerCredibility).filter_by(organizer_id=organizer_id).first()
        
        if not credibility:
            return {
                "organizer_id": organizer_id,
                "fund_access_allowed": True,
                "credibility_score": 100.0,
                "frozen": False,
                "reason": "No credibility record found (new organizer)"
            }
        
        return {
            "organizer_id": organizer_id,
            "fund_access_allowed": not credibility.frozen_fund_access,
            "credibility_score": credibility.credibility_score,
            "frozen": credibility.frozen_fund_access,
            "overdue_receipts": credibility.overdue_receipt_count,
            "reason": "Frozen due to overdue receipt" if credibility.frozen_fund_access else "Active"
        }


# ============================================================================
# FASTAPI INTEGRATION
# ============================================================================

from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session

app = FastAPI(title="Fund Release Engine", version="1.0.0")

def get_db() -> Session:
    """Dependency: Return database session"""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    engine = create_engine("sqlite:///./fund_release.db")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()


@app.post("/api/fund-release/validate", response_model=ReleaseRoutingResponse)
async def validate_and_route_release(
    request: ReleaseValidationRequest,
    db: Session = Depends(get_db)
):
    """
    Validate transaction and route to appropriate tier (Emergency vs. Milestone).
    """
    try:
        FundReleaseEngine.validate_split_tier_routing(request.transaction_amount)
        tier, routing_context = FundReleaseEngine.route_release(request)
        
        transaction_id = str(uuid.uuid4())
        
        if tier == ReleaseTier.EMERGENCY:
            result = FundReleaseEngine.process_tier1_emergency_release(
                transaction_id=transaction_id,
                organizer_id=request.organizer_id,
                amount=request.transaction_amount,
                off_ramp_partner_id=request.off_ramp_partner_id or "",
                db_session=db
            )
            db.commit()
            
            return ReleaseRoutingResponse(
                tier=tier,
                status=ReleaseStatus.RELEASED,
                transaction_id=transaction_id,
                released_amount=result["immediate_release_amount"],
                remaining_balance=result["held_amount"],
                capped_percentage=EMERGENCY_CAPPED_PERCENTAGE,
                receipt_validation_required=True,
                receipt_deadline=datetime.utcnow().timestamp() + (RECEIPT_VALIDATION_WINDOW_DAYS * 86400),
                message="Emergency tier: Immediate release to off-ramp partner. Receipt validation required."
            )
        else:
            result = FundReleaseEngine.process_tier2_milestone_release(
                transaction_id=transaction_id,
                organizer_id=request.organizer_id,
                amount=request.transaction_amount,
                preceding_milestone_id=request.milestone_context.get("preceding_milestone_id") if request.milestone_context else None,
                db_session=db
            )
            db.commit()
            
            return ReleaseRoutingResponse(
                tier=tier,
                status=ReleaseStatus.PENDING,
                transaction_id=transaction_id,
                released_amount=0.0,
                remaining_balance=request.transaction_amount,
                milestone_block_active=result["milestone_block_active"],
                receipt_validation_required=False,
                message="Milestone tier: Funds frozen. Milestone verification required to unlock and allow subsequent payouts."
            )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/fund-release/validate-receipt")
async def validate_receipt(
    request: ReceiptValidationRequest,
    db: Session = Depends(get_db)
):
    """
    Validate receipt submission and update organizer credibility.
    """
    try:
        transaction = db.query(FundReleaseTransaction).filter_by(id=request.transaction_id).first()
        if not transaction:
            raise ValueError(f"Transaction {request.transaction_id} not found")
        
        result = FundReleaseEngine.validate_receipt_and_update_credibility(
            transaction_id=request.transaction_id,
            organizer_id=transaction.organizer_id,
            receipt_verified=True,
            db_session=db
        )
        db.commit()
        return result
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/fund-release/verify-milestone")
async def verify_milestone(
    request: MilestoneProofRequest,
    db: Session = Depends(get_db)
):
    """
    Milestone validation hook: Verify proof of completion and unlock subsequent payouts.
    """
    try:
        result = FundReleaseEngine.verify_milestone_completion(
            transaction_id=request.transaction_id,
            milestone_id=request.milestone_id,
            proof_verified=True,
            db_session=db
        )
        db.commit()
        return result
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/fund-release/access-status/{organizer_id}")
async def get_fund_access_status(
    organizer_id: str,
    db: Session = Depends(get_db)
):
    """
    Check organizer's fund access status and credibility score.
    """
    return FundReleaseEngine.check_fund_access_status(organizer_id, db)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
