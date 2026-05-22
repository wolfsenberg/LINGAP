from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.config import settings
from app.models.user import User, UserRole
from app.schemas.user import AdminLoginRequest, UserCreate, UserRead, LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=dict, status_code=201)
async def register(body: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        name=body.name,
        hashed_password=hash_password(body.password),
        role=body.role,
        stellar_public_key=body.stellar_public_key,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"success": True, "message": "User registered", "data": UserRead.model_validate(user)}


@router.post("/login", response_model=dict)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(str(user.id))
    return {
        "success": True,
        "message": "Login successful",
        "data": {"token": token, "user": UserRead.model_validate(user)},
    }


@router.post("/admin-login", response_model=dict)
async def admin_login(body: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    if body.email != settings.ADMIN_EMAIL or body.password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin credentials")

    result = await db.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
    user = result.scalar_one_or_none()

    if user:
        user.name = "LINGAP Admin"
        user.hashed_password = hash_password(settings.ADMIN_PASSWORD)
        user.role = UserRole.admin
    else:
        user = User(
            email=settings.ADMIN_EMAIL,
            name="LINGAP Admin",
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            role=UserRole.admin,
        )
        db.add(user)

    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id))
    return {
        "success": True,
        "message": "Admin login successful",
        "data": {"token": token, "user": UserRead.model_validate(user)},
    }


@router.get("/me", response_model=dict)
async def me(user: User = Depends(get_current_user)):
    return {"success": True, "message": "ok", "data": UserRead.model_validate(user)}
