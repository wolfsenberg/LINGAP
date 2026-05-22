from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from sqlalchemy import select
import uuid

bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        user_id = decode_token(credentials.credentials)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if _role_value(user.role) != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def _role_value(role) -> str:
    return role.value if hasattr(role, "value") else str(role)


async def require_aid_worker_or_admin(user: User = Depends(get_current_user)) -> User:
    """Allow aid workers and admins to confirm/dispute progress updates.

    Kept separate from ``require_admin`` so the admin gate is untouched.
    """
    if _role_value(user.role) not in ("admin", "aid_worker"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Aid worker or admin access required",
        )
    return user
