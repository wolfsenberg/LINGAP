from fastapi import APIRouter, Query, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.stellar.client import verify_transaction, get_account_info
from app.stellar import soroban
from app.core.database import get_db

router = APIRouter(prefix="/stellar", tags=["stellar"])


# ── Existing Horizon routes ───────────────────────────────────────────────────

@router.get("/verify")
async def verify_tx(tx_hash: str = Query(...)):
    result = await verify_transaction(tx_hash)
    return {"success": True, "message": "ok", "data": result}


@router.get("/account")
async def account_info(public_key: str = Query(...)):
    result = await get_account_info(public_key)
    return {"success": True, "message": "ok", "data": result}


# ── Escrow: donor deposit flow ────────────────────────────────────────────────

class DepositXdrRequest(BaseModel):
    campaign_id: int
    donor_public_key: str
    amount_xlm: float


@router.post("/escrow/deposit-xdr")
async def get_deposit_xdr(body: DepositXdrRequest):
    try:
        stroops = int(body.amount_xlm * 10_000_000)
        xdr = await soroban.build_deposit_xdr(
            campaign_id=body.campaign_id,
            donor_public_key=body.donor_public_key,
            amount_stroops=stroops,
        )
        return {"success": True, "data": {"xdr": xdr}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class SubmitXdrRequest(BaseModel):
    signed_xdr: str


@router.post("/escrow/submit")
async def submit_xdr(body: SubmitXdrRequest):
    try:
        tx_hash = await soroban.submit_signed_xdr(body.signed_xdr)
        return {"success": True, "data": {"tx_hash": tx_hash}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Escrow: admin milestone management ───────────────────────────────────────

@router.post("/escrow/verify/{campaign_id}")
async def verify_milestone(campaign_id: int):
    try:
        tx_hash = await soroban.admin_verify_milestone(campaign_id)
        return {"success": True, "data": {"tx_hash": tx_hash}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/escrow/release/{campaign_id}")
async def release_milestone(campaign_id: int):
    try:
        tx_hash = await soroban.admin_release_milestone(campaign_id)
        return {"success": True, "data": {"tx_hash": tx_hash}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/escrow/pause/{campaign_id}")
async def pause_campaign(campaign_id: int):
    try:
        tx_hash = await soroban.admin_pause_campaign(campaign_id)
        return {"success": True, "data": {"tx_hash": tx_hash}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/escrow/unpause/{campaign_id}")
async def unpause_campaign(campaign_id: int):
    try:
        tx_hash = await soroban.admin_unpause_campaign(campaign_id)
        return {"success": True, "data": {"tx_hash": tx_hash}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Escrow: read-only queries ─────────────────────────────────────────────────

@router.get("/escrow/campaign/{campaign_id}")
async def get_campaign(campaign_id: int):
    try:
        data = await soroban.query_campaign(campaign_id)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/escrow/count")
async def campaign_count():
    try:
        count = await soroban.query_campaign_count()
        return {"success": True, "data": {"count": count}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Donor voting ──────────────────────────────────────────────────────────────

class VoteRequest(BaseModel):
    donor_public_key: str


@router.post("/escrow/vote/{campaign_id}")
async def vote_pause(
    campaign_id: int,
    body: VoteRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Returns an unsigned vote_pause XDR for the donor to sign with Freighter.
    After signing, submit via POST /escrow/submit.
    """
    try:
        xdr = await soroban.build_vote_pause_xdr(
            campaign_id=campaign_id,
            donor_public_key=body.donor_public_key,
        )
        return {"success": True, "data": {"xdr": xdr, "action": "vote_pause"}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/escrow/vote/{campaign_id}")
async def revoke_vote(
    campaign_id: int,
    body: VoteRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Returns an unsigned revoke_vote XDR for the donor to sign with Freighter.
    After signing, submit via POST /escrow/submit.
    """
    try:
        xdr = await soroban.build_revoke_vote_xdr(
            campaign_id=campaign_id,
            donor_public_key=body.donor_public_key,
        )
        return {"success": True, "data": {"xdr": xdr, "action": "revoke_vote"}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/escrow/votes/{campaign_id}")
async def get_vote_status(
    campaign_id: int,
    donor_public_key: str | None = Query(default=None),
):
    """
    Returns on-chain vote status for a campaign.
    Optionally pass donor_public_key to check if a specific donor has voted.
    """
    try:
        data = await soroban.query_vote_status(
            campaign_id=campaign_id,
            donor_public_key=donor_public_key,
        )
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/escrow/clawback/{campaign_id}")
async def execute_clawback(campaign_id: int):
    """
    Admin: execute proportional clawback of unspent funds to donors.
    Requires campaign paused AND >= 60% vote weight.
    """
    try:
        tx_hash = await soroban.admin_execute_clawback(campaign_id)
        return {"success": True, "data": {"tx_hash": tx_hash}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
