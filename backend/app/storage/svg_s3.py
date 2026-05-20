"""Async S3 storage for SVG certificates with public bucket support."""
from __future__ import annotations

import hashlib
from dataclasses import dataclass

import boto3
from botocore.exceptions import ClientError

from app.config import settings


@dataclass(frozen=True)
class StoredSVGCertificate:
    s3_url: str
    svg_hash: str


async def upload_svg_certificate(
    svg_content: str,
    donation_id: str,
) -> StoredSVGCertificate:
    """Upload SVG certificate to public S3 bucket asynchronously.

    Args:
        svg_content: SVG XML as string
        donation_id: Donation ID for file naming

    Returns:
        StoredSVGCertificate with public s3_url and svg_hash

    Raises:
        Exception on S3 upload failure
    """
    svg_hash = hashlib.sha256(svg_content.encode()).hexdigest()
    s3_key = f"certificates/{donation_id}/certificate-{svg_hash[:16]}.svg"

    try:
        client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )

        client.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=s3_key,
            Body=svg_content.encode("utf-8"),
            ContentType="image/svg+xml",
            CacheControl="public, max-age=31536000",
            Metadata={
                "donation_id": donation_id,
                "hash": svg_hash,
                "content_type": "svg_certificate",
            },
        )

        s3_url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"

        return StoredSVGCertificate(s3_url=s3_url, svg_hash=svg_hash)
    except ClientError as e:
        raise Exception(f"SVG S3 upload failed: {e}")


async def upload_certificate_html_wrapper(
    html_content: str,
    donation_id: str,
) -> str:
    """Upload HTML wrapper with embedded SVG to S3.

    Args:
        html_content: HTML with embedded SVG
        donation_id: Donation ID for file naming

    Returns:
        Public S3 URL to HTML wrapper

    Raises:
        Exception on S3 upload failure
    """
    s3_key = f"certificates/{donation_id}/certificate.html"

    try:
        client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )

        client.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=s3_key,
            Body=html_content.encode("utf-8"),
            ContentType="text/html; charset=utf-8",
            CacheControl="public, max-age=31536000",
            Metadata={
                "donation_id": donation_id,
                "content_type": "certificate_html",
            },
        )

        s3_url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
        return s3_url
    except ClientError as e:
        raise Exception(f"HTML wrapper S3 upload failed: {e}")


async def delete_certificate_assets(donation_id: str) -> None:
    """Delete all certificate assets (SVG, HTML, PDF) for a donation from S3.

    Args:
        donation_id: Donation ID to delete assets for
    """
    try:
        client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )

        prefix = f"certificates/{donation_id}/"

        response = client.list_objects_v2(
            Bucket=settings.AWS_S3_BUCKET,
            Prefix=prefix,
        )

        if "Contents" in response:
            delete_objects = [{"Key": obj["Key"]} for obj in response["Contents"]]
            client.delete_objects(
                Bucket=settings.AWS_S3_BUCKET,
                Delete={"Objects": delete_objects},
            )
    except ClientError as e:
        raise Exception(f"Failed to delete certificate assets: {e}")
