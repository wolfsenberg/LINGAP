from fastapi import APIRouter
from .auth import router as auth_router
from .donations import router as donations_router
from .beneficiaries import router as beneficiaries_router
from .aid_requests import router as aid_requests_router
from .dashboard import router as dashboard_router
from .stellar import router as stellar_router
from .proofs import router as proofs_router
<<<<<<< HEAD
<<<<<<< HEAD
from .certificates import router as certificates_router
from .onchain_certificates import router as onchain_certificates_router
=======
=======
>>>>>>> 53d2963129c62f8def465d37ded0cc8ef0e3c640
from .progress import progress_router, verify_router
from .risk import (
    router as risk_router,
    aid_request_risk_router,
    aid_request_spending_router,
)
from .credibility import router as credibility_router
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> 2b1fff9a23c4939c8cb985f1a13ca23360523f86
=======
>>>>>>> 53d2963129c62f8def465d37ded0cc8ef0e3c640
=======
from .leaderboard import router as leaderboard_router
from .volunteer import router as volunteer_router
>>>>>>> 5c2540a1daf08152b08f5c2cce1a5e1da7b3d675

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(donations_router)
api_router.include_router(beneficiaries_router)
api_router.include_router(aid_requests_router)
api_router.include_router(dashboard_router)
api_router.include_router(stellar_router)
api_router.include_router(proofs_router)
<<<<<<< HEAD
<<<<<<< HEAD
api_router.include_router(certificates_router)
api_router.include_router(onchain_certificates_router)
=======
=======
>>>>>>> 53d2963129c62f8def465d37ded0cc8ef0e3c640
api_router.include_router(progress_router)
api_router.include_router(verify_router)
api_router.include_router(risk_router)
api_router.include_router(aid_request_risk_router)
api_router.include_router(aid_request_spending_router)
api_router.include_router(credibility_router)
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> 2b1fff9a23c4939c8cb985f1a13ca23360523f86
=======
>>>>>>> 53d2963129c62f8def465d37ded0cc8ef0e3c640
=======
api_router.include_router(leaderboard_router)
api_router.include_router(volunteer_router)
>>>>>>> 5c2540a1daf08152b08f5c2cce1a5e1da7b3d675
