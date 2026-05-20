from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.core.database import init_db
from app.api.v1.router import api_router
from app.streaks.listener import register as register_streak_listeners


@asynccontextmanager
async def lifespan(app: FastAPI):
    register_streak_listeners()
    await init_db()
    yield


app = FastAPI(
    title="LINGAP API",
    description="Ledger for Integrity, Need-based Giving, Aid Provenance, and Protection",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "LINGAP API"}
