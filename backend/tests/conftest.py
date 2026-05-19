"""Pytest fixtures: sqlite-in-memory database + httpx AsyncClient.

The async sqlite engine is wired through the same SQLAlchemy ``Base`` metadata
the production app uses, so registering new models in
``app/models/__init__.py`` is enough to create their tables here.
"""
from __future__ import annotations

import asyncio
import os
import tempfile
import uuid
from typing import AsyncIterator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-do-not-use-in-prod")
os.environ.setdefault("STELLAR_NETWORK", "testnet")
os.environ.setdefault("STELLAR_HORIZON_URL", "https://horizon-testnet.stellar.org")
os.environ.setdefault("STELLAR_SOURCE_SECRET_KEY", "")
os.environ.setdefault("CONTRACT_AID_PROVENANCE", "")
os.environ.setdefault("CONTRACT_DONATION_VAULT", "")
os.environ.setdefault("CONTRACT_BENEFICIARY_REGISTRY", "")

_TMP_UPLOAD_DIR = tempfile.mkdtemp(prefix="lingap-uploads-")
os.environ["UPLOAD_DIR"] = _TMP_UPLOAD_DIR


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def db_engine():
    # Import after env vars are set so settings pick them up.
    from app.core import database as db_module
    import app.models  # noqa: F401 — ensure all models are registered

    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(db_module.Base.metadata.create_all)

    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine) -> AsyncIterator[AsyncSession]:
    SessionLocal = async_sessionmaker(db_engine, expire_on_commit=False)
    async with SessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_engine) -> AsyncIterator[AsyncClient]:
    from app.core import database as db_module
    from app.main import app

    SessionLocal = async_sessionmaker(db_engine, expire_on_commit=False)

    async def override_get_db() -> AsyncIterator[AsyncSession]:
        async with SessionLocal() as session:
            yield session

    app.dependency_overrides[db_module.get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.pop(db_module.get_db, None)


@pytest_asyncio.fixture
async def auth_user(db_session: AsyncSession, client: AsyncClient):
    """Create a default donor user + return Authorization header."""
    from app.core.security import create_access_token, hash_password
    from app.models.user import User, UserRole

    user = User(
        id=uuid.uuid4(),
        email="donor@test.io",
        name="Test Donor",
        hashed_password=hash_password("pass1234"),
        role=UserRole.donor,
    )
    db_session.add(user)
    await db_session.commit()
    token = create_access_token(str(user.id))
    return {"user": user, "headers": {"Authorization": f"Bearer {token}"}}


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession):
    from app.core.security import create_access_token, hash_password
    from app.models.user import User, UserRole

    user = User(
        id=uuid.uuid4(),
        email="admin@test.io",
        name="Test Admin",
        hashed_password=hash_password("pass1234"),
        role=UserRole.admin,
    )
    db_session.add(user)
    await db_session.commit()
    token = create_access_token(str(user.id))
    return {"user": user, "headers": {"Authorization": f"Bearer {token}"}}


@pytest_asyncio.fixture
async def aid_worker_user(db_session: AsyncSession):
    from app.core.security import create_access_token, hash_password
    from app.models.user import User, UserRole

    user = User(
        id=uuid.uuid4(),
        email="worker@test.io",
        name="Test Worker",
        hashed_password=hash_password("pass1234"),
        role=UserRole.aid_worker,
    )
    db_session.add(user)
    await db_session.commit()
    token = create_access_token(str(user.id))
    return {"user": user, "headers": {"Authorization": f"Bearer {token}"}}


@pytest_asyncio.fixture
async def seed_aid_request(db_session: AsyncSession):
    from app.models.aid_request import AidRequest, AidRequestStatus
    from app.models.beneficiary import Beneficiary, BeneficiaryCategory, NeedLevel

    b = Beneficiary(
        id=uuid.uuid4(),
        name="Maria Santos",
        national_id=f"NID-{uuid.uuid4().hex[:8]}",
        location="Manila",
        category=BeneficiaryCategory.individual,
        need_level=NeedLevel.high,
        verified=True,
        stellar_public_key="GABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZAB12",
        total_received=0,
    )
    db_session.add(b)
    await db_session.commit()

    req = AidRequest(
        id=uuid.uuid4(),
        beneficiary_id=b.id,
        requested_amount=1000,
        asset="XLM",
        purpose="Hospital admission for chemotherapy",
        status=AidRequestStatus.pending,
    )
    db_session.add(req)
    await db_session.commit()
    await db_session.refresh(req)
    return req
