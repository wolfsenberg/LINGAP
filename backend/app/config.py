from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://lingap:password@localhost:5432/lingap"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALGORITHM: str = "HS256"

    STELLAR_NETWORK: str = "testnet"
    STELLAR_HORIZON_URL: str = "https://horizon-testnet.stellar.org"
    STELLAR_SOURCE_SECRET_KEY: str = ""

    CONTRACT_AID_PROVENANCE: str = ""
    CONTRACT_DONATION_VAULT: str = ""
    CONTRACT_BENEFICIARY_REGISTRY: str = ""

    CORS_ORIGINS: str = "http://localhost:3000"

    # Proof of Reality / file uploads
    UPLOAD_DIR: str = "/app/uploads/proofs"
    MAX_UPLOAD_MB: int = 10
    ALLOWED_UPLOAD_MIME: str = "image/png,image/jpeg,image/webp,application/pdf"

    # Disbursement gating (flipped on once frontend lands)
    ENFORCE_PROOF_GATE: bool = False
    MIN_PROOFS_FOR_DISBURSE: int = 1

    # AI risk audit
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_VISION_MODEL: str = ""
    RISK_ENGINE: str = "llm"
    RISK_AUTO_BLOCK_LEVEL: str = "critical"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def allowed_upload_mime_list(self) -> list[str]:
        return [m.strip() for m in self.ALLOWED_UPLOAD_MIME.split(",") if m.strip()]


settings = Settings()
