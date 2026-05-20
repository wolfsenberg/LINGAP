"""Unified storage abstraction layer for proof artifacts with localized filesystem backend.

Factory pattern enables swappable storage backends (local, S3, etc.) without changing
API contract. Current implementation uses local disk; S3 backend can be added in Phase 2.
"""

from dataclasses import dataclass
from typing import Protocol
import os
import uuid
import hashlib
from enum import Enum

import aiofiles
from fastapi import HTTPException, UploadFile, status

from app.config import settings

CHUNK_SIZE = 1024 * 64


class StorageBackendType(str, Enum):
    """Supported storage backends."""
    LOCAL = "local"
    S3 = "s3"


@dataclass(frozen=True)
class StoredFile:
    """Metadata for stored file."""
    stored_path: str
    public_url: str
    sha256: str
    size_bytes: int
    mime: str
    filename: str


class StorageBackend(Protocol):
    """Abstract interface for storage backends."""
    
    async def save(
        self, upload: UploadFile, aid_request_id: uuid.UUID
    ) -> StoredFile:
        """Save an uploaded file and return metadata."""
        ...
    
    async def get_stream(self, stored_path: str):
        """Open a file stream for download."""
        ...
    
    async def exists(self, stored_path: str) -> bool:
        """Check if file exists at path."""
        ...


class LocalStorageBackend:
    """Local filesystem storage backend."""
    
    def __init__(self, upload_dir: str, max_upload_mb: int, allowed_mimes: list[str]):
        self.upload_dir = upload_dir
        self.max_upload_mb = max_upload_mb
        self.allowed_mimes = {m.lower() for m in allowed_mimes}
    
    async def save(
        self, upload: UploadFile, aid_request_id: uuid.UUID
    ) -> StoredFile:
        """Persist an uploaded file to local disk."""
        mime = (upload.content_type or "application/octet-stream").lower()
        
        if mime not in self.allowed_mimes:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported mime type: {mime}",
            )
        
        max_bytes = self.max_upload_mb * 1024 * 1024
        target_dir = os.path.join(self.upload_dir, str(aid_request_id))
        os.makedirs(target_dir, exist_ok=True)
        
        tmp_name = f".tmp-{uuid.uuid4().hex}"
        tmp_path = os.path.join(target_dir, tmp_name)
        
        hasher = hashlib.sha256()
        total = 0
        try:
            async with aiofiles.open(tmp_path, "wb") as out:
                while True:
                    chunk = await upload.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    total += len(chunk)
                    if total > max_bytes:
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"File exceeds {self.max_upload_mb} MB limit",
                        )
                    hasher.update(chunk)
                    await out.write(chunk)
        except HTTPException:
            raise
        except Exception as e:
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="File upload failed",
            ) from e
        
        sha256 = hasher.hexdigest()
        _, ext = os.path.splitext(upload.filename or "")
        ext = ext.lower()
        final_name = f"{sha256[:16]}{ext}"
        final_path = os.path.join(target_dir, final_name)
        
        if os.path.exists(final_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
        else:
            os.replace(tmp_path, final_path)
        
        public_url = f"/api/v1/aid-requests/{aid_request_id}/proofs/{sha256[:16]}/download"
        
        return StoredFile(
            stored_path=final_path,
            public_url=public_url,
            sha256=sha256,
            size_bytes=total,
            mime=mime,
            filename=upload.filename or final_name,
        )
    
    async def get_stream(self, stored_path: str):
        """Open a stored file stream for download."""
        if not os.path.exists(stored_path):
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="File is no longer available",
            )
        return open(stored_path, "rb")
    
    async def exists(self, stored_path: str) -> bool:
        """Check if file exists."""
        return os.path.exists(stored_path)


# Storage factory
_backend: StorageBackend | None = None


def get_storage_backend() -> StorageBackend:
    """Get or initialize storage backend based on configuration."""
    global _backend
    
    if _backend is None:
        backend_type = getattr(settings, "STORAGE_BACKEND", "local").lower()
        
        if backend_type == "s3":
            raise NotImplementedError("S3 backend not yet implemented; use local storage")
        
        _backend = LocalStorageBackend(
            upload_dir=settings.UPLOAD_DIR,
            max_upload_mb=settings.MAX_UPLOAD_MB,
            allowed_mimes=settings.allowed_upload_mime_list,
        )
    
    return _backend


async def save_upload(
    upload: UploadFile,
    aid_request_id: uuid.UUID,
) -> StoredFile:
    """Save an uploaded file using the configured storage backend."""
    backend = get_storage_backend()
    return await backend.save(upload, aid_request_id)


async def open_stream(stored_path: str):
    """Open a stored file stream for download."""
    backend = get_storage_backend()
    return await backend.get_stream(stored_path)


async def file_exists(stored_path: str) -> bool:
    """Check if a stored file exists."""
    backend = get_storage_backend()
    return await backend.exists(stored_path)
