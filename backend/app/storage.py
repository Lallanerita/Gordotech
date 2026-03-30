"""
Cloudflare R2 Storage Module

Uses boto3 (S3-compatible) to upload images to Cloudflare R2.
Falls back to local filesystem storage when R2 is not configured.

Required environment variables for R2:
  - R2_ACCOUNT_ID: Cloudflare account ID
  - R2_ACCESS_KEY_ID: R2 API token access key
  - R2_SECRET_ACCESS_KEY: R2 API token secret key
  - R2_BUCKET_NAME: R2 bucket name (default: gordotech-images)
  - R2_PUBLIC_URL: Public URL of the R2 bucket (e.g. https://pub-xxx.r2.dev)
"""

import os
import uuid
import logging

import boto3
from botocore.config import Config

logger = logging.getLogger(__name__)

# R2 Configuration from environment variables
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "gordotech-images")
R2_PUBLIC_URL = os.environ.get("R2_PUBLIC_URL", "").rstrip("/")

# Check if R2 is configured
R2_ENABLED = bool(R2_ACCOUNT_ID and R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY and R2_PUBLIC_URL)

# Local upload directory (fallback when R2 is not configured)
UPLOAD_DIR = "/data/uploads" if os.path.exists("/data") else "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize S3 client for R2 if configured
_s3_client = None


def _get_s3_client():
    """Lazy-initialize the S3 client for Cloudflare R2."""
    global _s3_client
    if _s3_client is None and R2_ENABLED:
        _s3_client = boto3.client(
            "s3",
            endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            config=Config(
                retries={"max_attempts": 3, "mode": "standard"},
                signature_version="s3v4",
            ),
            region_name="auto",
        )
    return _s3_client


def get_content_type(ext: str) -> str:
    """Get MIME type from file extension."""
    mime_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
    }
    return mime_types.get(ext.lower(), "application/octet-stream")


def upload_file(content: bytes, ext: str) -> str:
    """
    Upload a file to R2 (if configured) or local filesystem.

    Args:
        content: File content as bytes
        ext: File extension including dot (e.g. ".jpg", ".png")

    Returns:
        Public URL of the uploaded file
    """
    filename = f"{uuid.uuid4().hex}{ext}"

    if R2_ENABLED:
        return _upload_to_r2(content, filename, ext)
    else:
        return _upload_to_local(content, filename)


def _upload_to_r2(content: bytes, filename: str, ext: str) -> str:
    """Upload file to Cloudflare R2 and return public URL."""
    client = _get_s3_client()
    if client is None:
        logger.warning("R2 client not available, falling back to local storage")
        return _upload_to_local(content, filename)

    key = f"uploads/{filename}"
    content_type = get_content_type(ext)

    try:
        client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=key,
            Body=content,
            ContentType=content_type,
        )
        url = f"{R2_PUBLIC_URL}/{key}"
        logger.info(f"Uploaded to R2: {url}")
        return url
    except Exception as e:
        logger.error(f"R2 upload failed: {e}, falling back to local storage")
        return _upload_to_local(content, filename)


def _upload_to_local(content: bytes, filename: str) -> str:
    """Upload file to local filesystem and return relative URL."""
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    return f"/uploads/{filename}"


def is_r2_enabled() -> bool:
    """Check if R2 storage is configured and enabled."""
    return R2_ENABLED
