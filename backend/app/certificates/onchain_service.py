"""On-chain certificate service: Stellar verification → SVG generation → S3 upload → DB save."""
from datetime import datetime
import hashlib

from app.stellar.client import verify_transaction
from app.certificates.svg_generator import (
    generate_svg_certificate,
    get_svg_hash,
    wrap_svg_with_png_fallback,
)
from app.storage.svg_s3 import (
    upload_svg_certificate,
    upload_certificate_html_wrapper,
    StoredSVGCertificate,
)


class OnChainCertificateService:
    """Orchestrates Stellar verification → certificate generation → storage."""

    async def generate_and_store_certificate(
        self,
        stellar_tx_hash: str,
        donor_name: str,
        amount: float,
        beneficiary_name: str,
        milestone_description: str,
        lives_touched: int,
        total_donated: float,
        donation_id: str,
        donation_date: datetime,
        merkle_proof: str | None = None,
        onchain_hash: str | None = None,
    ) -> dict:
        """End-to-end flow: verify Stellar tx → generate SVG → upload to S3.

        Args:
            stellar_tx_hash: Stellar blockchain transaction hash
            donor_name: Donor name
            amount: Donation amount
            beneficiary_name: Beneficiary name
            milestone_description: Milestone description
            lives_touched: Lives touched count
            total_donated: Total donated by donor
            donation_id: Donation UUID as string
            donation_date: Donation datetime
            merkle_proof: Optional merkle proof for verification chain
            onchain_hash: Optional on-chain hash (e.g., contract state hash)

        Returns:
            {
                "svg_s3_url": str,
                "html_s3_url": str,
                "svg_hash": str,
                "verified": bool,
                "tx_verified": bool,
                "stellar_ledger": int | None,
                "merkle_proof": str | None,
                "onchain_hash": str | None,
            }

        Raises:
            Exception if verification fails or S3 upload fails
        """

        # Step 1: Verify Stellar transaction on-chain
        tx_verification = await verify_transaction(stellar_tx_hash)
        tx_verified = tx_verification.get("confirmed", False)
        stellar_ledger = tx_verification.get("ledger")

        if not tx_verified:
            raise Exception(f"Stellar transaction {stellar_tx_hash} not confirmed")

        # Step 2: Generate SVG certificate with blockchain metadata
        svg_content = generate_svg_certificate(
            donor_name=donor_name,
            amount=amount,
            beneficiary_name=beneficiary_name,
            milestone_description=milestone_description,
            lives_touched=lives_touched,
            total_donated=total_donated,
            donation_date=donation_date,
            stellar_tx_hash=stellar_tx_hash,
            merkle_proof=merkle_proof,
            onchain_hash=onchain_hash,
        )

        svg_hash = get_svg_hash(svg_content)

        # Step 3: Generate HTML wrapper with embedded SVG for social previews
        html_wrapper = wrap_svg_with_png_fallback(svg_content, donation_id)

        # Step 4: Upload to public S3 bucket (async)
        svg_stored = await upload_svg_certificate(svg_content, donation_id)
        html_s3_url = await upload_certificate_html_wrapper(html_wrapper, donation_id)

        # Step 5: Compute certificate integrity hash (for future merkle proofs)
        cert_integrity_hash = hashlib.sha256(
            f"{svg_hash}{stellar_tx_hash}{stellar_ledger}".encode()
        ).hexdigest()

        return {
            "svg_s3_url": svg_stored.s3_url,
            "html_s3_url": html_s3_url,
            "svg_hash": svg_hash,
            "verified": True,
            "tx_verified": tx_verified,
            "stellar_ledger": stellar_ledger,
            "merkle_proof": merkle_proof,
            "onchain_hash": onchain_hash,
            "cert_integrity_hash": cert_integrity_hash,
        }
