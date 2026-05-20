"""Certificate generation and data enrichment endpoints for blockchain-verified donations."""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.donation import Donation
from app.models.user import User
from app.models.aid_request import AidRequest
from app.models.beneficiary import Beneficiary
from app.models.provenance import ProvenanceRecord
from app.schemas.certificate import CertificateRead

router = APIRouter(prefix="/certificates", tags=["certificates"])


async def _enrich_certificate(
    db: AsyncSession, donation_id: uuid.UUID
) -> CertificateRead:
    """Fetch donation and linked data for certificate rendering."""
    donation = (
        await db.execute(select(Donation).where(Donation.id == donation_id))
    ).scalar_one_or_none()
    
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    
    donor = (
        await db.execute(select(User).where(User.id == donation.donor_id))
    ).scalar_one_or_none()
    
    # Fetch provenance records to find linked aid request
    provenance_records = (
        await db.execute(
            select(ProvenanceRecord).where(
                ProvenanceRecord.donation_id == donation_id
            )
        )
    ).scalars().all()
    
    aid_request = None
    beneficiary = None
    milestone_status = None
    
    if provenance_records:
        pr = provenance_records[0]
        aid_request = (
            await db.execute(
                select(AidRequest).where(AidRequest.id == pr.aid_request_id)
            )
        ).scalar_one_or_none()
        
        if aid_request and aid_request.beneficiary_id:
            beneficiary = (
                await db.execute(
                    select(Beneficiary).where(
                        Beneficiary.id == aid_request.beneficiary_id
                    )
                )
            ).scalar_one_or_none()
        
        milestone_status = aid_request.status if aid_request else None
    
    return CertificateRead(
        donation_id=donation.id,
        donor_name=donor.name if donor else "Unknown Donor",
        amount=float(donation.amount),
        asset=donation.asset,
        date=donation.created_at,
        tx_id=donation.stellar_tx_hash,
        blockchain_confirmed=donation.blockchain_confirmed,
        campaign_title=aid_request.purpose if aid_request else "Campaign",
        campaign_institution=beneficiary.name if beneficiary else "Institution",
        milestone_status=milestone_status.value if milestone_status else "pending",
        merkle_proof=provenance_records[0].merkle_proof if provenance_records else None,
    )


@router.get("/{donation_id}", response_model=CertificateRead)
async def get_certificate(
    donation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> CertificateRead:
    """Fetch enriched certificate data for a donation record."""
    return await _enrich_certificate(db, donation_id)
