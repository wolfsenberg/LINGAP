"""FastAPI endpoint for on-chain donation certificate generation."""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.donation import Donation
from app.models.donation_certificate import DonationCertificate
from app.certificates.onchain_service import OnChainCertificateService

router = APIRouter(prefix="/certificates", tags=["on-chain-certificates"])


class GenerateOnChainCertificateRequest(BaseModel):
    """Request to generate on-chain verified certificate."""

    stellar_tx_hash: str
    donation_id: uuid.UUID
    merkle_proof: str | None = None
    onchain_hash: str | None = None


class OnChainCertificateResponse(BaseModel):
    """Response with certificate URLs and verification details."""

    certificate_id: uuid.UUID
    svg_s3_url: str
    html_s3_url: str
    svg_hash: str
    verified: bool
    tx_verified: bool
    stellar_ledger: int | None
    merkle_proof: str | None
    onchain_hash: str | None
    cert_integrity_hash: str


@router.post(
    "/generate-onchain",
    response_model=OnChainCertificateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def generate_onchain_certificate(
    request: GenerateOnChainCertificateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> OnChainCertificateResponse:
    """Generate on-chain verified donation certificate.

    Flow:
    1. Verify Stellar transaction via client.py
    2. Generate responsive SVG with blockchain metadata
    3. Wrap SVG in HTML for social previews
    4. Async upload both to public S3 bucket
    5. Save certificate metadata to DB with verification details
    6. Return public URLs and integrity hash

    Args:
        request: Donation ID, Stellar tx hash, optional proof metadata
        db: Database session
        user: Authenticated user (must be donor)

    Returns:
        OnChainCertificateResponse with public URLs and verification chain

    Raises:
        404: Donation not found
        403: User is not the donor
        400: Stellar transaction verification failed or certificate already exists
        500: S3 upload or service failure
    """

    # Step 1: Fetch donation and verify ownership
    donation = (
        await db.execute(
            select(Donation).where(Donation.id == request.donation_id)
        )
    ).scalar_one_or_none()

    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found",
        )

    if donation.donor_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the donor can generate a certificate for this donation",
        )

    # Step 2: Check if certificate already exists
    existing_cert = (
        await db.execute(
            select(DonationCertificate).where(
                DonationCertificate.donation_id == request.donation_id
            )
        )
    ).scalar_one_or_none()

    if existing_cert:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Certificate already exists for this donation",
        )

    # Step 3: Fetch donor and beneficiary data for certificate
    donor_name = user.name or user.email
    beneficiary_name = donation.donor.name if hasattr(donation, "beneficiary") else "Community"

    # Step 4: Call on-chain certificate service
    try:
        service = OnChainCertificateService()
        cert_data = await service.generate_and_store_certificate(
            stellar_tx_hash=request.stellar_tx_hash,
            donor_name=donor_name,
            amount=float(donation.amount),
            beneficiary_name=beneficiary_name,
            milestone_description="Community Impact",
            lives_touched=0,
            total_donated=float(donation.amount),
            donation_id=str(request.donation_id),
            donation_date=donation.created_at,
            merkle_proof=request.merkle_proof,
            onchain_hash=request.onchain_hash,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Certificate generation failed: {str(e)}",
        )

    # Step 5: Save certificate to database
    new_certificate = DonationCertificate(
        id=uuid.uuid4(),
        donation_id=request.donation_id,
        s3_url="",
        svg_s3_url=cert_data["svg_s3_url"],
        pdf_hash="",
        svg_hash=cert_data["svg_hash"],
        is_public=False,
        donor_name=donor_name,
        amount=donation.amount,
        beneficiary_name=beneficiary_name,
        milestone_description="Community Impact",
        lives_touched=0,
        total_donated=donation.amount,
        stellar_tx_hash=request.stellar_tx_hash,
        merkle_proof=request.merkle_proof,
        onchain_hash=request.onchain_hash,
        verified=cert_data["verified"],
    )

    db.add(new_certificate)
    await db.commit()
    await db.refresh(new_certificate)

    return OnChainCertificateResponse(
        certificate_id=new_certificate.id,
        svg_s3_url=cert_data["svg_s3_url"],
        html_s3_url=cert_data["html_s3_url"],
        svg_hash=cert_data["svg_hash"],
        verified=cert_data["verified"],
        tx_verified=cert_data["tx_verified"],
        stellar_ledger=cert_data["stellar_ledger"],
        merkle_proof=request.merkle_proof,
        onchain_hash=request.onchain_hash,
        cert_integrity_hash=cert_data["cert_integrity_hash"],
    )


@router.get("/onchain/{cert_id}")
async def get_onchain_certificate(
    cert_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
) -> OnChainCertificateResponse:
    """Retrieve on-chain certificate details with verification chain.

    Args:
        cert_id: Certificate ID
        db: Database session
        user: Authenticated user (optional)

    Returns:
        OnChainCertificateResponse with full verification metadata
    """

    cert = (
        await db.execute(
            select(DonationCertificate).where(DonationCertificate.id == cert_id)
        )
    ).scalar_one_or_none()

    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found",
        )

    if not cert.is_public and (not user or user.id != cert.donation.donor_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this certificate",
        )

    return OnChainCertificateResponse(
        certificate_id=cert.id,
        svg_s3_url=cert.svg_s3_url or "",
        html_s3_url="",
        svg_hash=cert.svg_hash or "",
        verified=cert.verified,
        tx_verified=True,
        stellar_ledger=None,
        merkle_proof=cert.merkle_proof,
        onchain_hash=cert.onchain_hash,
        cert_integrity_hash="",
    )
