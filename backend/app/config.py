from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://lingap:password@localhost:5432/lingap"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALGORITHM: str = "HS256"
    ADMIN_PASSWORD: str = "lingap12345678"
    ADMIN_EMAIL: str = "lingap.admin@test.com"

    STELLAR_NETWORK: str = "testnet"
    STELLAR_HORIZON_URL: str = "https://horizon-testnet.stellar.org"
    STELLAR_SOURCE_SECRET_KEY: str = ""

    CONTRACT_AID_PROVENANCE: str = "CC5EBH4P72CSGGSDM22UJSBHPV7G5BFFSQCDPAOGACQNG6KJWVZ5GDSC"
    CONTRACT_DONATION_VAULT: str = "CDZTFM2BHBLYQLIJSSF7UOSWCQMQMOUATXEJTDOHKBIZ6R4DFZKB7DDP"
    CONTRACT_BENEFICIARY_REGISTRY: str = "CDPQC74JGFZ5BUNUELBO7M5ZNO6EEPEG4QYATODEWLDEMCI6I7YMGJDT"

    CORS_ORIGINS: str = "http://localhost:3000,https://lingap-ledger.vercel.app"

    # Proof of Reality / file uploads
    UPLOAD_DIR: str = "/app/uploads/proofs"
    MAX_UPLOAD_MB: int = 10
    ALLOWED_UPLOAD_MIME: str = "image/png,image/jpeg,image/webp,application/pdf"

    # Disbursement gating (flipped on once frontend lands)
    ENFORCE_PROOF_GATE: bool = False
    MIN_PROOFS_FOR_DISBURSE: int = 1

    # AI risk audit -- provider-agnostic settings (preferred)
    LLM_PROVIDER: str = "groq"
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = "https://api.groq.com/openai/v1"
    LLM_MODEL: str = "llama-3.1-8b-instant"
    LLM_VISION_MODEL: str = ""

    # Legacy OpenAI names (backward compatible; used only if LLM_* are empty)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = ""
    OPENAI_VISION_MODEL: str = ""

    RISK_ENGINE: str = "llm"
    RISK_AUTO_BLOCK_LEVEL: str = "critical"

    # AWS S3 for certificates
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = ""
    AWS_REGION: str = "us-east-1"
    AWS_S3_PRESIGNED_EXPIRY_HOURS: int = 24

    # Certificate generation
    CERTIFICATE_TITLE_FONT: str = "Helvetica-Bold"
    CERTIFICATE_BODY_FONT: str = "Helvetica"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def allowed_upload_mime_list(self) -> list[str]:
        return [m.strip() for m in self.ALLOWED_UPLOAD_MIME.split(",") if m.strip()]

    @property
    def effective_api_key(self) -> str:
        """Provider API key, preferring LLM_API_KEY then falling back to OPENAI_API_KEY."""
        return self.LLM_API_KEY or self.OPENAI_API_KEY

    @property
    def effective_base_url(self) -> str:
        """Base URL for the LLM provider. Empty string means use OpenAI default."""
        if self.LLM_API_KEY:
            return self.LLM_BASE_URL
        if self.OPENAI_API_KEY:
            return ""
        return self.LLM_BASE_URL

    @property
    def effective_model(self) -> str:
        """Model name, preferring LLM_MODEL then falling back to OPENAI_MODEL."""
        return self.LLM_MODEL or self.OPENAI_MODEL or "llama-3.1-8b-instant"

    @property
    def effective_vision_model(self) -> str:
        return self.LLM_VISION_MODEL or self.OPENAI_VISION_MODEL


settings = Settings()
