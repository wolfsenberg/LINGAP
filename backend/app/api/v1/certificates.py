"""Certificate endpoints - retrieve, download, toggle visibility."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.donation_certificate import DonationCertificate
from app.models.donation import Donation
from app.schemas.donation_certificate import (
    DonationCertificateRead,
    DonationCertificateUpdate,
)
from app.storage.s3 import generate_presigned_download_url

router = APIRouter(prefix="/certificates", tags=["certificates"])


@router.get("/{cert_id}", response_model=DonationCertificateRead)
async def get_certificate(
    cert_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    """Get certificate details. Public certificates visible to all, private only to owner."""
    cert = (
        await db.execute(
            select(DonationCertificate).where(DonationCertificate.id == cert_id)
        )
    ).scalar_one_or_none()

    if not cert:
        raise HTTPException(404, "Certificate not found")

    if not cert.is_public and (not user or user.id != cert.donation.donor_id):
        raise HTTPException(403, "Not authorized to view this certificate")

    return DonationCertificateRead.model_validate(cert)


@router.get("/donation/{donation_id}", response_model=DonationCertificateRead)
async def get_certificate_by_donation(
    donation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get certificate for a specific donation. Only accessible by donor or if public."""
    cert = (
        await db.execute(
            select(DonationCertificate).where(
                DonationCertificate.donation_id == donation_id
            )
        )
    ).scalar_one_or_none()

    if not cert:
        raise HTTPException(404, "Certificate not found for this donation")

    if not cert.is_public and user.id != cert.donation.donor_id:
        raise HTTPException(403, "Not authorized to view this certificate")

    return DonationCertificateRead.model_validate(cert)


@router.patch("/{cert_id}", response_model=DonationCertificateRead)
async def update_certificate_visibility(
    cert_id: uuid.UUID,
    body: DonationCertificateUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Toggle certificate public/private visibility. Only owner can update."""
    cert = (
        await db.execute(
            select(DonationCertificate).where(DonationCertificate.id == cert_id)
        )
    ).scalar_one_or_none()

    if not cert:
        raise HTTPException(404, "Certificate not found")

    if user.id != cert.donation.donor_id:
        raise HTTPException(403, "Only certificate owner can update visibility")

    cert.is_public = body.is_public
    await db.commit()
    await db.refresh(cert)

    return DonationCertificateRead.model_validate(cert)


@router.get("/{cert_id}/download")
async def download_certificate(
    cert_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    """Get presigned download URL for certificate PDF."""
    cert = (
        await db.execute(
            select(DonationCertificate).where(DonationCertificate.id == cert_id)
        )
    ).scalar_one_or_none()

    if not cert:
        raise HTTPException(404, "Certificate not found")

    if not cert.is_public and (not user or user.id != cert.donation.donor_id):
        raise HTTPException(403, "Not authorized to download this certificate")

    s3_key = f"certificates/{cert.donation_id}/{cert.pdf_hash[:16]}.pdf"
    presigned_url = await generate_presigned_download_url(s3_key)

    return {"download_url": presigned_url, "filename": f"certificate-{cert.donation_id}.pdf"}


@router.get("/donor/{donor_id}/all", response_model=list[DonationCertificateRead])
async def list_donor_certificates(
    donor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    """List all certificates for a donor. Public certs visible to all, private only to owner."""
    if not user or (user.id != donor_id and user.role.value != "admin"):
        query = select(DonationCertificate).where(
            DonationCertificate.donation.has(donor_id=donor_id),
            DonationCertificate.is_public == True,
        )
    else:
        query = select(DonationCertificate).where(
            DonationCertificate.donation.has(donor_id=donor_id)
        )

    result = await db.execute(query)
    certificates = result.scalars().all()

    return [DonationCertificateRead.model_validate(c) for c in certificates]
