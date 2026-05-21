import pytest
from httpx import AsyncClient
from app.api.v1.fund_release import organizers_db, milestones_db, OrganizerAccount, Milestone, ReceiptState, MilestoneState

@pytest.fixture(autouse=True)
def reset_db():
    # Reset in-memory mock databases before each test
    organizers_db.clear()
    milestones_db.clear()
    
    # Seed data
    organizers_db["org-1"] = OrganizerAccount(
        account_id="org-1",
        registered_off_ramp_partner="partner-1"
    )
    
    organizers_db["org-frozen"] = OrganizerAccount(
        account_id="org-frozen",
        registered_off_ramp_partner="partner-1",
        receipt_state=ReceiptState.OVERDUE,
        is_frozen=True
    )

    milestones_db["ms-1"] = Milestone(
        milestone_id="ms-1",
        amount=25000,
        state=MilestoneState.VERIFIED
    )

    milestones_db["ms-locked"] = Milestone(
        milestone_id="ms-locked",
        amount=25000,
        state=MilestoneState.LOCKED
    )

@pytest.mark.asyncio
async def test_emergency_fund_release_success(client: AsyncClient):
    response = await client.post(
        "/api/v1/fund-release/process",
        json={
            "organizer_id": "org-1",
            "requested_amount": 10000,
            "total_pool_balance": 50000
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "APPROVED"
    assert data["tier"] == 1
    assert data["released_amount"] == 10000
    assert data["account_updates"]["receipt_state"] == "pending"

@pytest.mark.asyncio
async def test_emergency_fund_release_cap(client: AsyncClient):
    response = await client.post(
        "/api/v1/fund-release/process",
        json={
            "organizer_id": "org-1",
            "requested_amount": 10000,
            "total_pool_balance": 10000 # Cap is 50%
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["released_amount"] == 5000

@pytest.mark.asyncio
async def test_milestone_fund_release_success(client: AsyncClient):
    response = await client.post(
        "/api/v1/fund-release/process",
        json={
            "organizer_id": "org-1",
            "requested_amount": 20000,
            "total_pool_balance": 50000,
            "current_milestone_id": "ms-1"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "APPROVED"
    assert data["tier"] == 2
    assert data["released_amount"] == 20000

@pytest.mark.asyncio
async def test_milestone_fund_release_locked(client: AsyncClient):
    response = await client.post(
        "/api/v1/fund-release/process",
        json={
            "organizer_id": "org-1",
            "requested_amount": 20000,
            "total_pool_balance": 50000,
            "current_milestone_id": "ms-locked"
        }
    )
    assert response.status_code == 423
    assert "lock" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_frozen_account_blocked(client: AsyncClient):
    response = await client.post(
        "/api/v1/fund-release/process",
        json={
            "organizer_id": "org-frozen",
            "requested_amount": 10000,
            "total_pool_balance": 50000
        }
    )
    assert response.status_code == 403
    assert "frozen" in response.json()["detail"]

@pytest.mark.asyncio
async def test_milestone_validation_hook(client: AsyncClient):
    # Verify the milestone hook properly changes the state
    response = await client.post(
        "/api/v1/fund-release/hooks/verify-milestone/ms-locked?proof_url=https://proof.com"
    )
    assert response.status_code == 200
    
    # Check the state updated in mock db
    assert milestones_db["ms-locked"].state == MilestoneState.VERIFIED
    assert milestones_db["ms-locked"].proof_of_completion == "https://proof.com"
