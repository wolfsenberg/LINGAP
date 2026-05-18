from fastapi import APIRouter, Query
from app.stellar.client import verify_transaction, get_account_info

router = APIRouter(prefix="/stellar", tags=["stellar"])


@router.get("/verify")
async def verify_tx(tx_hash: str = Query(...)):
    result = await verify_transaction(tx_hash)
    return {"success": True, "message": "ok", "data": result}


@router.get("/account")
async def account_info(public_key: str = Query(...)):
    result = await get_account_info(public_key)
    return {"success": True, "message": "ok", "data": result}
