from fastapi import APIRouter
from .auth import router as auth_router
from .donations import router as donations_router
from .beneficiaries import router as beneficiaries_router
from .aid_requests import router as aid_requests_router
from .dashboard import router as dashboard_router
from .stellar import router as stellar_router
from .proofs import router as proofs_router
from .certificates import router as certificates_router
from .onchain_certificates import router as onchain_certificates_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(donations_router)
api_router.include_router(beneficiaries_router)
api_router.include_router(aid_requests_router)
api_router.include_router(dashboard_router)
api_router.include_router(stellar_router)
api_router.include_router(proofs_router)
api_router.include_router(certificates_router)
api_router.include_router(onchain_certificates_router)
