"""Local-disk storage backend for proof artifacts.

Streams the multipart upload to a sha256-named file under
``settings.UPLOAD_DIR/{aid_request_id}/``. Returns metadata
(path, sha256, size, mime) for persistence in the database.
"""
from __future__ import annotations

import hashlib
import os
import uuid
from dataclasses import dataclass

import aiofiles
from fastapi import HTTPException, UploadFile, status

from app.config import settings

CHUNK_SIZE = 1024 * 64


@dataclass(frozen=True)
class StoredFile:
    stored_path: str
    sha256: str
    size_bytes: int
    mime: str
    filename: str


def _ext_from_filename(name: str) -> str:
    _, ext = os.path.splitext(name or "")
    return ext.lower()


async def save_upload(
    upload: UploadFile,
    aid_request_id: uuid.UUID,
) -> StoredFile:
    """Persist an uploaded file to disk and return its metadata.

    Enforces mime allowlist and ``MAX_UPLOAD_MB``. Raises HTTPException on
    violation so callers can let it propagate.
    """
    mime = (upload.content_type or "application/octet-stream").lower()
    if mime not in {m.lower() for m in settings.allowed_upload_mime_list}:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported mime type: {mime}",
        )

    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    target_dir = os.path.join(settings.UPLOAD_DIR, str(aid_request_id))
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
                        detail=f"File exceeds {settings.MAX_UPLOAD_MB} MB limit",
                    )
                hasher.update(chunk)
                await out.write(chunk)
    except Exception:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
        raise

    sha256 = hasher.hexdigest()
    ext = _ext_from_filename(upload.filename or "")
    final_name = f"{sha256[:16]}{ext}"
    final_path = os.path.join(target_dir, final_name)

    if os.path.exists(final_path):
        try:
            os.remove(tmp_path)
        except OSError:
            pass
    else:
        os.replace(tmp_path, final_path)

    return StoredFile(
        stored_path=final_path,
        sha256=sha256,
        size_bytes=total,
        mime=mime,
        filename=upload.filename or final_name,
    )


def open_stream(stored_path: str):
    """Open a stored file for streaming download (sync iterator)."""
    return open(stored_path, "rb")
