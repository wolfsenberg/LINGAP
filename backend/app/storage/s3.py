"""S3 storage backend for donation certificates."""
from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import timedelta

import boto3
from botocore.exceptions import ClientError

from app.config import settings


@dataclass(frozen=True)
class StoredCertificate:
    s3_url: str
    pdf_hash: str


def get_s3_client():
    """Create and return S3 client."""
    return boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )


async def upload_certificate_pdf(
    pdf_bytes: bytes,
    donation_id: str,
) -> StoredCertificate:
    """Upload certificate PDF to S3 and return metadata.

    Args:
        pdf_bytes: PDF file content as bytes
        donation_id: Donation ID for file naming

    Returns:
        StoredCertificate with s3_url and pdf_hash

    Raises:
        Exception on S3 upload failure
    """
    pdf_hash = hashlib.sha256(pdf_bytes).hexdigest()
    s3_key = f"certificates/{donation_id}/{pdf_hash[:16]}.pdf"

    try:
        client = get_s3_client()
        client.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=s3_key,
            Body=pdf_bytes,
            ContentType="application/pdf",
            Metadata={
                "donation_id": donation_id,
                "hash": pdf_hash,
            },
        )

        s3_url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"

        return StoredCertificate(s3_url=s3_url, pdf_hash=pdf_hash)
    except ClientError as e:
        raise Exception(f"S3 upload failed: {e}")


async def upload_certificate_png(
    png_bytes: bytes,
    donation_id: str,
) -> StoredCertificate:
    """Upload certificate PNG to S3 and return metadata.

    Args:
        png_bytes: PNG file content as bytes
        donation_id: Donation ID for file naming

    Returns:
        StoredCertificate with s3_url and png_hash

    Raises:
        Exception on S3 upload failure
    """
    png_hash = hashlib.sha256(png_bytes).hexdigest()
    s3_key = f"certificates/{donation_id}/{png_hash[:16]}.png"

    try:
        client = get_s3_client()
        client.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=s3_key,
            Body=png_bytes,
            ContentType="image/png",
            CacheControl="public, max-age=31536000, immutable",
            ContentDisposition=f'inline; filename="lingap-certificate-{donation_id}.png"',
            Metadata={
                "donation_id": donation_id,
                "hash": png_hash,
            },
        )

        s3_url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"

        return StoredCertificate(s3_url=s3_url, pdf_hash=png_hash)
    except ClientError as e:
        raise Exception(f"S3 upload failed: {e}")


async def generate_presigned_download_url(s3_key: str) -> str:
    """Generate a presigned URL for downloading a certificate.

    Args:
        s3_key: S3 object key

    Returns:
        Presigned URL valid for 24 hours
    """
    try:
        client = get_s3_client()
        url = client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.AWS_S3_BUCKET,
                "Key": s3_key,
            },
            ExpiresIn=settings.AWS_S3_PRESIGNED_EXPIRY_HOURS * 3600,
        )
        return url
    except ClientError as e:
        raise Exception(f"Failed to generate presigned URL: {e}")


async def delete_certificate(s3_key: str) -> None:
    """Delete a certificate from S3.

    Args:
        s3_key: S3 object key
    """
    try:
        client = get_s3_client()
        client.delete_object(Bucket=settings.AWS_S3_BUCKET, Key=s3_key)
    except ClientError as e:
        raise Exception(f"S3 delete failed: {e}")
