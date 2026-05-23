"""Certificate endpoints - retrieve, download, toggle visibility."""
from __future__ import annotations

import uuid
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.donation_certificate import DonationCertificate
from app.models.donation import Donation
from app.models.campaign_drive import CampaignDrive
from app.schemas.donation_certificate import (
    DonationCertificateRead,
    DonationCertificateUpdate,
)
from app.certificates.generator import generate_certificate_pdf

router = APIRouter(prefix="/certificates", tags=["certificates"])


def _campaign_id_from_purpose(purpose: str | None) -> str | None:
    if not purpose or not purpose.startswith("campaign:"):
        return None
    return purpose.replace("campaign:", "", 1)


async def _campaign_title_for_donation(db: AsyncSession, donation: Donation) -> str:
    campaign_id = _campaign_id_from_purpose(donation.purpose)
    if not campaign_id:
        return "LINGAP Campaign"
    campaign = (
        await db.execute(select(CampaignDrive).where(CampaignDrive.id == campaign_id))
    ).scalar_one_or_none()
    return campaign.title if campaign else "LINGAP Campaign"


async def _get_donation(db: AsyncSession, donation_id: uuid.UUID) -> Donation | None:
    return (await db.execute(select(Donation).where(Donation.id == donation_id))).scalar_one_or_none()


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

    donation = await _get_donation(db, cert.donation_id)
    if not donation:
        raise HTTPException(404, "Donation record not found")
    if not cert.is_public and (not user or user.id != donation.donor_id):
        raise HTTPException(403, "Not authorized to view this certificate")

    return DonationCertificateRead.model_validate(cert)


@router.get("/{cert_id}/public")
async def get_public_certificate_page(
    cert_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    cert = (
        await db.execute(
            select(DonationCertificate).where(DonationCertificate.id == cert_id)
        )
    ).scalar_one_or_none()

    if not cert or not cert.is_public:
        raise HTTPException(404, "Public certificate not found")

    donation = await _get_donation(db, cert.donation_id)
    if not donation:
        raise HTTPException(404, "Donation record not found")
    campaign_name = await _campaign_title_for_donation(db, donation)
    donor = (await db.execute(select(User).where(User.id == donation.donor_id))).scalar_one_or_none()
    donor_name = cert.donor_name or (donor.stellar_public_key if donor else None) or "Anonymous Donor"
    tx_hash = cert.stellar_tx_hash or donation.stellar_tx_hash or "N/A"
    html = f"""
    <!doctype html>
    <html>
    <head><meta charset="utf-8"><title>LINGAP Certificate {cert.id}</title></head>
    <body style="font-family:Arial,sans-serif;background:#f5f7f5;padding:24px;color:#17231D;">
      <div style="max-width:760px;margin:0 auto;background:#fff;border:1px solid #d7e1d9;border-radius:12px;padding:28px;">
        <h1 style="margin:0 0 10px;">LINGAP On-Chain Donation Proof</h1>
        <p style="margin:0 0 22px;color:#4A5C52;">Public Impact Certificate</p>
        <p><strong>User Name:</strong> {donor_name}</p>
        <p><strong>Campaign Name:</strong> {campaign_name}</p>
        <p><strong>Milestone:</strong> {cert.milestone_description}</p>
        <p><strong>Donation Amount:</strong> {float(cert.amount):,.2f} XLM</p>
        <p><strong>Transaction Hash:</strong> {tx_hash}</p>
        <p><strong>Verification:</strong> {"Verified" if cert.verified else "Pending"}</p>
      </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html)


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

    donation = await _get_donation(db, cert.donation_id)
    if not donation:
        raise HTTPException(404, "Donation record not found")
    if not cert.is_public and user.id != donation.donor_id:
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

    donation = await _get_donation(db, cert.donation_id)
    if not donation:
        raise HTTPException(404, "Donation record not found")
    if user.id != donation.donor_id:
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
    """Render certificate PDF on demand and stream it."""
    cert = (
        await db.execute(
            select(DonationCertificate).where(DonationCertificate.id == cert_id)
        )
    ).scalar_one_or_none()

    if not cert:
        raise HTTPException(404, "Certificate not found")

    donation = await _get_donation(db, cert.donation_id)
    if not donation:
        raise HTTPException(404, "Donation record not found")
    if not cert.is_public and (not user or user.id != donation.donor_id):
        raise HTTPException(403, "Not authorized to download this certificate")

    campaign_name = await _campaign_title_for_donation(db, donation)
    milestone = cert.milestone_description or "Campaign milestone completed"
    donor = (await db.execute(select(User).where(User.id == donation.donor_id))).scalar_one_or_none()
    donor_name = cert.donor_name or (donor.name if donor else None) or (donor.stellar_public_key if donor else None) or "Anonymous Donor"
    tx_hash = cert.stellar_tx_hash or donation.stellar_tx_hash or "N/A"

    pdf_bytes = generate_certificate_pdf(
        donor_name=donor_name,
        amount=float(cert.amount),
        beneficiary_name=campaign_name,
        milestone_description=milestone,
        lives_touched=int(cert.lives_touched or 0),
        total_donated=float(cert.total_donated or cert.amount),
        current_donation=float(cert.amount),
        donation_date=donation.created_at,
        stellar_tx_hash=tx_hash,
    )

    filename = f"certificate-{cert.donation_id}.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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


@router.get("")
async def list_certificates(
    donor_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    query = select(DonationCertificate).order_by(DonationCertificate.created_at.desc())
    if donor_id:
        query = query.where(DonationCertificate.donation.has(donor_id=donor_id))

    certs = (await db.execute(query)).scalars().all()
    items = []
    for cert in certs:
        if not cert.is_public and (not user or user.id != cert.donation.donor_id):
            donation = await _get_donation(db, cert.donation_id)
            if not donation:
                continue
            if not user or user.id != donation.donor_id:
                continue
        donation = await _get_donation(db, cert.donation_id)
        if not donation:
            continue
        campaign_name = await _campaign_title_for_donation(db, donation)
        items.append(
            {
                "id": str(cert.id),
                "donation_id": str(cert.donation_id),
                "donor_name": cert.donor_name,
                "amount": float(cert.amount),
                "beneficiary_name": cert.beneficiary_name,
                "campaign_name": campaign_name,
                "milestone_description": cert.milestone_description,
                "stellar_tx_hash": cert.stellar_tx_hash,
                "verified": cert.verified,
                "is_public": cert.is_public,
                "created_at": cert.created_at,
                "public_url": f"/api/v1/certificates/{cert.id}/public" if cert.is_public else None,
                "download_url": f"/api/v1/certificates/{cert.id}/download",
            }
        )
    return {"success": True, "data": items}
