"""Certificate creation service — orchestrates certificate generation and storage.

Production-grade flow:
  1. Validate donation is blockchain-confirmed
  2. Gather donor, beneficiary, and provenance data
  3. Generate PNG certificate via PNGCertificateHydrator
  4. Upload to S3
  5. Persist DonationCertificate record
"""
from __future__ import annotations

import logging
import time
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.donation import Donation
from app.models.donation_certificate import DonationCertificate
from app.models.aid_request import AidRequest
from app.models.beneficiary import Beneficiary
from app.models.user import User
from app.models.provenance import ProvenanceRecord
from app.certificates.png_hydrator import PNGCertificateHydrator
from app.storage.s3 import upload_certificate_png
from app.config import settings

logger = logging.getLogger(__name__)

# Module-level singleton — reuses cached template + fonts across requests
_hydrator: Optional[PNGCertificateHydrator] = None


def _get_hydrator() -> PNGCertificateHydrator:
    """Lazy-initialise the certificate hydrator singleton.

    Uses the configured CERTIFICATE_TEMPLATE_PATH from settings, falling
    back to auto-detection in the hydrator constructor.
    """
    global _hydrator
    if _hydrator is None:
        template_path = settings.CERTIFICATE_TEMPLATE_PATH or None
        _hydrator = PNGCertificateHydrator(template_path=template_path)
        logger.info("Certificate hydrator initialised (template=%s)", template_path)
    return _hydrator


async def create_certificate_for_donation(
    donation: Donation,
    db: AsyncSession,
) -> Optional[DonationCertificate]:
    """Create and store a certificate for a confirmed donation.

    Args:
        donation: Donation object (must have blockchain_confirmed=True)
        db: Database session

    Returns:
        DonationCertificate record if successful, None on failure

    Raises:
        Exception on critical errors (logged but not raised to preserve donation flow)
    """
    start = time.monotonic()

    try:
        # ── Guard: only confirmed donations get certificates ──────────
        if not donation.blockchain_confirmed:
            logger.warning(
                "cert_skip: donation=%s reason=not_confirmed", donation.id,
            )
            return None

        # ── Load donor ────────────────────────────────────────────────
        donor = (
            await db.execute(select(User).where(User.id == donation.donor_id))
        ).scalar_one_or_none()

        if not donor:
            logger.error("cert_fail: donation=%s reason=donor_not_found", donation.id)
            return None

        # ── Load provenance records ───────────────────────────────────
        provenance_records = (
            await db.execute(
                select(ProvenanceRecord).where(
                    ProvenanceRecord.donation_id == donation.id
                )
            )
        ).scalars().all()

        if not provenance_records:
            logger.warning(
                "cert_skip: donation=%s reason=no_provenance_records", donation.id,
            )
            return None

        prov = provenance_records[0]

        # ── Load beneficiary & aid request ────────────────────────────
        aid_request = (
            await db.execute(
                select(AidRequest).where(AidRequest.id == prov.aid_request_id)
            )
        ).scalar_one_or_none()

        beneficiary = (
            await db.execute(
                select(Beneficiary).where(Beneficiary.id == prov.beneficiary_id)
            )
        ).scalar_one_or_none()

        if not beneficiary or not aid_request:
            logger.error(
                "cert_fail: donation=%s reason=missing_beneficiary_or_aid_request "
                "beneficiary=%s aid_request=%s",
                donation.id,
                beneficiary is not None,
                aid_request is not None,
            )
            return None

        # ── Compute aggregate metrics ─────────────────────────────────
        lives_touched_result = (
            await db.execute(
                select(func.count(func.distinct(ProvenanceRecord.beneficiary_id))).where(
                    ProvenanceRecord.donation_id == donation.id
                )
            )
        ).scalar()
        lives_touched = lives_touched_result or 0

        total_donated_result = (
            await db.execute(
                select(func.sum(Donation.amount)).where(
                    Donation.donor_id == donation.donor_id,
                    Donation.blockchain_confirmed == True,  # noqa: E712
                )
            )
        ).scalar()
        total_donated = float(total_donated_result or 0)

        milestone_description = (
            aid_request.purpose or f"Donation for {beneficiary.name}"
        )

        # ── Generate PNG ──────────────────────────────────────────────
        hydrator = _get_hydrator()
        png_buffer = hydrator.generate(
            donor_name=donor.name,
            amount=float(donation.amount),
            beneficiary_name=beneficiary.name,
            milestone_description=milestone_description,
            donation_date=donation.created_at,
            stellar_tx_hash=donation.stellar_tx_hash,
            merkle_proof=getattr(donation, "merkle_proof", None),
            onchain_hash=getattr(donation, "onchain_hash", None),
        )

        # ── Upload to S3 ─────────────────────────────────────────────
        png_bytes = png_buffer.getvalue()
        stored = await upload_certificate_png(png_bytes, str(donation.id))

        # ── Persist record ────────────────────────────────────────────
        certificate = DonationCertificate(
            donation_id=donation.id,
            s3_url=stored.s3_url,
            pdf_hash=stored.pdf_hash,
            is_public=False,
            donor_name=donor.name,
            amount=float(donation.amount),
            beneficiary_name=beneficiary.name,
            milestone_description=milestone_description,
            lives_touched=lives_touched,
            total_donated=total_donated,
        )

        db.add(certificate)
        await db.commit()
        await db.refresh(certificate)

        elapsed_ms = (time.monotonic() - start) * 1000
        logger.info(
            "cert_created: donation=%s cert=%s donor=%s amount=%.2f "
            "png_size=%d elapsed_ms=%.1f",
            donation.id, certificate.id, donor.name,
            float(donation.amount), len(png_bytes), elapsed_ms,
        )
        return certificate

    except Exception as e:
        elapsed_ms = (time.monotonic() - start) * 1000
        logger.error(
            "cert_error: donation=%s error=%s elapsed_ms=%.1f",
            donation.id, e, elapsed_ms,
            exc_info=True,
        )
        return None
