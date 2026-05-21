from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/fund-release", tags=["Fund Release"])

# --- Constants & Thresholds ---
TIER_1_THRESHOLD_PHP = 15000.00
EMERGENCY_RELEASE_CAP_PERCENT = 0.50 
CREDIBILITY_PENALTY = 15.0
CRITICAL_CREDIBILITY_SCORE = 50.0

# --- Enums & Models ---
class ReceiptState(str, Enum):
    PENDING = "pending"
    OVERDUE = "overdue"
    VERIFIED = "verified"

class MilestoneState(str, Enum):
    LOCKED = "locked"
    IN_PROGRESS = "in_progress"
    VERIFIED = "verified"

class OrganizerAccount(BaseModel):
    account_id: str
    credibility_score: float = 100.0
    receipt_state: Optional[ReceiptState] = None
    is_frozen: bool = False
    registered_off_ramp_partner: Optional[str] = None

class Milestone(BaseModel):
    milestone_id: str
    amount: float
    state: MilestoneState = MilestoneState.LOCKED
    proof_of_completion: Optional[str] = None

class FundReleaseRequest(BaseModel):
    organizer_id: str
    requested_amount: float = Field(..., gt=0, description="Requested amount in PHP")
    total_pool_balance: float = Field(..., ge=0)
    current_milestone_id: Optional[str] = None

class FundReleaseResponse(BaseModel):
    status: str
    tier: int
    released_amount: float
    message: str
    account_updates: Optional[Dict[str, Any]] = None

# --- Mock Data Stores (Replace with actual DB dependency injection) ---
organizers_db: Dict[str, OrganizerAccount] = {}
milestones_db: Dict[str, Milestone] = {}

# --- Helper Methods ---
def evaluate_account_standing(organizer: OrganizerAccount) -> OrganizerAccount:
    if organizer.receipt_state in [ReceiptState.PENDING, ReceiptState.OVERDUE]:
        organizer.credibility_score -= CREDIBILITY_PENALTY
        if organizer.credibility_score < CRITICAL_CREDIBILITY_SCORE or organizer.receipt_state == ReceiptState.OVERDUE:
            organizer.is_frozen = True
    return organizer

# --- Endpoints ---
@router.post("/process", response_model=FundReleaseResponse)
async def process_fund_release(request: FundReleaseRequest):
    organizer = organizers_db.get(request.organizer_id)
    if not organizer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organizer not found.")

    organizer = evaluate_account_standing(organizer)
    if organizer.is_frozen:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Account frozen: Pending or overdue receipts detected."
        )

    if request.requested_amount < TIER_1_THRESHOLD_PHP:
        # Tier 1 Logic: Emergency Quick-Release
        if not organizer.registered_off_ramp_partner:
             raise HTTPException(
                 status_code=status.HTTP_400_BAD_REQUEST, 
                 detail="Unregistered off-ramp partner. Cannot route emergency funds."
             )
             
        capped_amount = min(request.requested_amount, request.total_pool_balance * EMERGENCY_RELEASE_CAP_PERCENT)
        organizer.receipt_state = ReceiptState.PENDING
        
        return FundReleaseResponse(
            status="APPROVED",
            tier=1,
            released_amount=capped_amount,
            message=f"Emergency funds routed to {organizer.registered_off_ramp_partner}. Post-expenditure receipt required.",
            account_updates={
                "receipt_state": organizer.receipt_state.value, 
                "credibility_score": organizer.credibility_score
            }
        )
    else:
        # Tier 2 Logic: Milestone-Based Capital
        if not request.current_milestone_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Milestone ID required for Tier 2 capital release."
            )
            
        milestone = milestones_db.get(request.current_milestone_id)
        if not milestone:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone tracking not found.")
            
        if milestone.state != MilestoneState.VERIFIED:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED, 
                detail="Programmatic lock enforced: Preceding milestone proof of completion not explicitly verified."
            )
            
        allowed_release = min(request.requested_amount, milestone.amount, request.total_pool_balance)
        
        return FundReleaseResponse(
            status="APPROVED",
            tier=2,
            released_amount=allowed_release,
            message="Milestone verified. Tier 2 funds unlocked and released."
        )

@router.post("/hooks/verify-milestone/{milestone_id}")
async def milestone_validation_hook(milestone_id: str, proof_url: str):
    milestone = milestones_db.get(milestone_id)
    if not milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found.")
        
    milestone.proof_of_completion = proof_url
    milestone.state = MilestoneState.VERIFIED
    
    return {"status": "success", "message": f"Milestone {milestone_id} explicitly verified. Subsequent payouts unlocked."}
