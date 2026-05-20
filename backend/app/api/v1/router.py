from fastapi import APIRouter
from .auth import router as auth_router
from .donations import router as donations_router
from .beneficiaries import router as beneficiaries_router
from .aid_requests import router as aid_requests_router
from .dashboard import router as dashboard_router
from .stellar import router as stellar_router
from .proofs import router as proofs_router
from .progress import progress_router, verify_router
from .risk import (
    router as risk_router,
    aid_request_risk_router,
    aid_request_spending_router,
)
from .credibility import router as credibility_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(donations_router)
api_router.include_router(beneficiaries_router)
api_router.include_router(aid_requests_router)
api_router.include_router(dashboard_router)
api_router.include_router(stellar_router)
api_router.include_router(proofs_router)
api_router.include_router(progress_router)
api_router.include_router(verify_router)
api_router.include_router(risk_router)
api_router.include_router(aid_request_risk_router)
api_router.include_router(aid_request_spending_router)
api_router.include_router(credibility_router)
