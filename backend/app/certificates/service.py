"""Certificate creation service - orchestrates certificate generation and storage."""
from __future__ import annotations

import hashlib
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.donation import Donation
from app.models.donation_certificate import DonationCertificate
from app.models.aid_request import AidRequest
from app.models.beneficiary import Beneficiary
from app.models.user import User
from app.models.provenance import ProvenanceRecord
from app.models.campaign_drive import CampaignDrive

logger = logging.getLogger(__name__)


def _fallback_campaign_title(campaign_id: str) -> str:
    return campaign_id.replace("-", " ").replace("_", " ").title()


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
    try:
        if not donation.blockchain_confirmed:
            logger.warning(f"Donation {donation.id} not confirmed, skipping certificate")
            return None

        existing = (
            await db.execute(
                select(DonationCertificate).where(DonationCertificate.donation_id == donation.id)
            )
        ).scalar_one_or_none()
        if existing:
            return existing

        donor = (
            await db.execute(select(User).where(User.id == donation.donor_id))
        ).scalar_one_or_none()
        if not donor:
            logger.error(f"Donor not found for donation {donation.id}")
            return None

        campaign_id = None
        campaign_title = None
        if donation.purpose and donation.purpose.startswith("campaign:"):
            campaign_id = donation.purpose.replace("campaign:", "", 1)
            campaign = (
                await db.execute(select(CampaignDrive).where(CampaignDrive.id == campaign_id))
            ).scalar_one_or_none()
            campaign_title = campaign.title if campaign else _fallback_campaign_title(campaign_id)

        donor_name = donor.name or donor.stellar_public_key or donor.email

        total_donated_result = (
            await db.execute(
                select(func.sum(Donation.amount)).where(
                    Donation.donor_id == donation.donor_id,
                    Donation.blockchain_confirmed == True,
                )
            )
        ).scalar()
        total_donated = float(total_donated_result or 0)

        provenance_records = (
            await db.execute(
                select(ProvenanceRecord).where(
                    ProvenanceRecord.donation_id == donation.id
                )
            )
        ).scalars().all()

        if not provenance_records:
            milestone_description = campaign_title or "Campaign donation completed"
            beneficiary_name = campaign_title or "LINGAP Campaign"
            lives_touched = 0

            pdf_bytes = generate_certificate_pdf(
                donor_name=donor_name,
                amount=float(donation.amount),
                beneficiary_name=beneficiary_name,
                milestone_description=milestone_description,
                lives_touched=lives_touched,
                total_donated=total_donated,
                current_donation=float(donation.amount),
                donation_date=donation.created_at,
                stellar_tx_hash=donation.stellar_tx_hash,
            )

            stored = await upload_certificate_pdf(pdf_bytes, str(donation.id))
            certificate = DonationCertificate(
                donation_id=donation.id,
                s3_url=stored.s3_url,
                pdf_hash=stored.pdf_hash,
                is_public=True,
                donor_name=donor_name,
                amount=float(donation.amount),
                beneficiary_name=beneficiary_name,
                milestone_description=milestone_description,
                lives_touched=lives_touched,
                total_donated=total_donated,
                stellar_tx_hash=donation.stellar_tx_hash,
                verified=True,
            )
            db.add(certificate)
            await db.commit()
            await db.refresh(certificate)
            logger.info(f"Fallback campaign certificate created for donation {donation.id}")
            return certificate

        prov = provenance_records[0]

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
            logger.error(f"Beneficiary or AidRequest not found for donation {donation.id}")
            return None

        lives_touched_result = (
            await db.execute(
                select(func.count(func.distinct(ProvenanceRecord.beneficiary_id))).where(
                    ProvenanceRecord.donation_id == donation.id
                )
            )
        ).scalar()
        lives_touched = lives_touched_result or 0

        milestone_description = aid_request.purpose or campaign_title or f"Donation for {beneficiary.name}"

        pdf_bytes = generate_certificate_pdf(
            donor_name=donor_name,
            amount=float(donation.amount),
            beneficiary_name=beneficiary.name,
            milestone_description=milestone_description,
            lives_touched=lives_touched,
            total_donated=total_donated,
            current_donation=float(donation.amount),
            donation_date=donation.created_at,
            stellar_tx_hash=donation.stellar_tx_hash,
        )

        stored = await upload_certificate_pdf(pdf_bytes, str(donation.id))

        certificate = DonationCertificate(
            donation_id=donation.id,
            s3_url=stored.s3_url,
            pdf_hash=stored.pdf_hash,
            is_public=True,
            donor_name=donor_name,
            amount=float(donation.amount),
            beneficiary_name=beneficiary.name,
            milestone_description=milestone_description,
            lives_touched=lives_touched,
            total_donated=total_donated,
            stellar_tx_hash=donation.stellar_tx_hash,
            verified=True,
        )

        db.add(certificate)
        await db.commit()
        await db.refresh(certificate)

        logger.info(f"Certificate created for donation {donation.id}")
        return certificate

    except Exception as e:
        logger.error(f"Certificate generation failed for donation {donation.id}: {e}")
        return None
