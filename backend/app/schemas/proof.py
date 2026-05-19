from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.proof_artifact import ProofKind


class ProofArtifactRead(BaseModel):
    id: UUID
    aid_request_id: UUID
    uploader_id: UUID
    kind: ProofKind
    filename: str
    mime: str
    size_bytes: int
    sha256: str
    claimed_amount: float | None
    description: str | None
    stellar_anchor_tx: str | None
    deleted_at: datetime | None
    created_at: datetime
    download_url: str | None = None

    model_config = {"from_attributes": True}


class ProofArtifactList(BaseModel):
    items: list[ProofArtifactRead]
    total: int
