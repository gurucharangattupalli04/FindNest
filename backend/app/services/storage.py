"""
Storage service abstraction for FindNest.
Supports Firebase Storage with seamless local fallback for development and testing.
Validates file types, MIME types, magic bytes, and file size limits.
"""
import os
import re
import uuid
import logging
from typing import Tuple
from pathlib import Path
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

logger = logging.getLogger(__name__)

# Allowed image constraints
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Magic byte signatures for verified image formats
MAGIC_SIGNATURES = [
    (b"\xff\xd8\xff", "image/jpeg"),              # JPEG
    (b"\x89PNG\r\n\x1a\n", "image/png"),          # PNG
    (b"RIFF", "image/webp"),                      # WebP (RIFF....WEBP)
]


class StorageService:
    def __init__(self):
        self.firebase_initialized = False
        self.bucket = None
        self._init_firebase()

    def _init_firebase(self):
        """Initializes Firebase Admin SDK if credentials are provided."""
        cred_path = settings.FIREBASE_CREDENTIALS_PATH
        bucket_name = settings.FIREBASE_STORAGE_BUCKET

        if cred_path and os.path.exists(cred_path):
            try:
                import firebase_admin
                from firebase_admin import credentials, storage

                if not firebase_admin._apps:
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred, {
                        'storageBucket': bucket_name
                    })
                self.bucket = storage.bucket(bucket_name) if bucket_name else storage.bucket()
                self.firebase_initialized = True
                logger.info(f"Firebase Storage initialized successfully with bucket: {bucket_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize Firebase Storage ({e}). Falling back to local storage.")
                self.firebase_initialized = False
        else:
            logger.info("FIREBASE_CREDENTIALS_PATH not configured. Using local storage fallback.")
            self.firebase_initialized = False

    def validate_file(self, file: UploadFile, content: bytes) -> str:
        """
        Validates file extension, declared MIME type, magic bytes, and size limit.
        Returns the normalized content type.
        """
        # 1. Extension check
        original_name = file.filename or "uploaded_image.jpg"
        ext = Path(original_name).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file extension '{ext}'. Allowed formats: JPG, JPEG, PNG, WEBP."
            )

        # 2. Declared Content-Type check
        declared_type = (file.content_type or "").lower()
        if declared_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported image MIME type '{declared_type}'. Allowed types: image/jpeg, image/png, image/webp."
            )

        # 3. Magic Bytes verification
        matched_type = None
        if content.startswith(b"\xff\xd8\xff"):
            matched_type = "image/jpeg"
        elif content.startswith(b"\x89PNG\r\n\x1a\n"):
            matched_type = "image/png"
        elif content.startswith(b"RIFF") and len(content) >= 12 and content[8:12] == b"WEBP":
            matched_type = "image/webp"

        if not matched_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content does not match valid image binary signature. Uploaded file is corrupt or invalid."
            )

        # 4. File size check
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum permitted limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

        return matched_type

    def _generate_safe_filename(self, original_filename: str) -> str:
        """Generates a collision-free, sanitized filename."""
        raw_stem = Path(original_filename or "image").stem
        clean_stem = re.sub(r"[^a-zA-Z0-9_\-]", "_", raw_stem)[:30]
        ext = Path(original_filename or ".jpg").suffix.lower()
        unique_id = uuid.uuid4().hex[:12]
        return f"{unique_id}_{clean_stem}{ext}"

    async def save_image(self, file: UploadFile, user_id: int) -> Tuple[str, str, int]:
        """
        Saves the uploaded file to Firebase Storage if available, or local filesystem fallback.
        Returns (image_url, safe_filename, size_bytes).
        """
        content = await file.read()
        content_type = self.validate_file(file, content)
        safe_filename = self._generate_safe_filename(file.filename or "image.jpg")
        size_bytes = len(content)

        # 1. Firebase Storage Branch
        if self.firebase_initialized and self.bucket:
            try:
                blob_path = f"items/{safe_filename}"
                blob = self.bucket.blob(blob_path)
                blob.metadata = {"uploaded_by": str(user_id)}
                blob.upload_from_string(content, content_type=content_type)
                
                try:
                    blob.make_public()
                    image_url = blob.public_url
                except Exception:
                    # Fallback to standard Firebase URL with token or signed URL
                    token = uuid.uuid4().hex
                    blob.metadata = {"firebaseStorageDownloadTokens": token, "uploaded_by": str(user_id)}
                    blob.patch()
                    bucket_name = self.bucket.name
                    image_url = f"https://firebasestorage.googleapis.com/v0/b/{bucket_name}/o/items%2F{safe_filename}?alt=media&token={token}"

                logger.info(f"Image uploaded to Firebase Storage: {image_url}")
                return image_url, safe_filename, size_bytes
            except Exception as e:
                logger.error(f"Error uploading to Firebase Storage: {e}. Falling back to local storage.")

        # 2. Local Fallback Branch (for dev / testing)
        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = upload_dir / safe_filename

        with open(file_path, "wb") as f:
            f.write(content)

        image_url = f"/static/uploads/{safe_filename}"
        logger.info(f"Image saved to local fallback: {image_url}")
        return image_url, safe_filename, size_bytes


storage_service = StorageService()
