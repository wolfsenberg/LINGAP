"""SQLAlchemy event hook that triggers streak recompute on Donation confirm.

We listen for `blockchain_confirmed` flipping ``False -> True`` so streak
state stays current without editing ``donations.py``. The recompute runs in
a fresh async session via ``asyncio.create_task``; failures are logged but
never bubble up to the caller.
"""
from __future__ import annotations

import asyncio
import logging
import uuid

from sqlalchemy import event
from sqlalchemy.orm.attributes import get_history

from app.models.donation import Donation

log = logging.getLogger(__name__)
_REGISTERED = False


async def _recompute_async(user_id: uuid.UUID) -> None:
    from app.core.database import AsyncSessionLocal
    from app.streaks.service import streak_service

    async with AsyncSessionLocal() as session:
        try:
            await streak_service.recompute(session, user_id)
        except Exception:  # noqa: BLE001
            log.exception("Streak recompute failed for %s", user_id)


def _on_after_update(mapper, connection, target: Donation) -> None:  # noqa: ARG001
    history = get_history(target, "blockchain_confirmed")
    if not history.has_changes():
        return
    new_values = history.added or []
    old_values = history.deleted or []
    flipped_true = any(bool(v) for v in new_values) and not any(bool(v) for v in old_values)
    if not flipped_true:
        return

    user_id = target.donor_id
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_recompute_async(user_id))
    except RuntimeError:
        # No running loop (e.g., sync test path). Recompute inline.
        try:
            asyncio.run(_recompute_async(user_id))
        except RuntimeError:
            log.warning(
                "Could not schedule streak recompute for %s (no event loop)", user_id
            )


def _on_after_insert(mapper, connection, target: Donation) -> None:  # noqa: ARG001
    """If a donation is inserted already confirmed, recompute immediately."""
    if not target.blockchain_confirmed:
        return
    user_id = target.donor_id
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_recompute_async(user_id))
    except RuntimeError:
        try:
            asyncio.run(_recompute_async(user_id))
        except RuntimeError:
            log.warning(
                "Could not schedule streak recompute for %s (no event loop)", user_id
            )


def register() -> None:
    """Idempotently register the SQLAlchemy listeners on Donation."""
    global _REGISTERED
    if _REGISTERED:
        return
    event.listen(Donation, "after_update", _on_after_update)
    event.listen(Donation, "after_insert", _on_after_insert)
    _REGISTERED = True
