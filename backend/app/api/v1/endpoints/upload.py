"""
Image upload endpoints for FindNest.
Provides authenticated, validated file upload to Firebase Storage with local fallback.
"""
from fastapi import APIRouter, Depends, File, UploadFile, status
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.upload import ImageUploadResponse
from app.services.storage import storage_service

router = APIRouter()


@router.post(
    "/image",
    response_model=ImageUploadResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload Item Image",
    description="Secure authenticated endpoint to upload an item image. Supports JPG, JPEG, PNG, WEBP up to 5MB.",
    responses={
        200: {"description": "Image uploaded successfully"},
        400: {"description": "Invalid file type, invalid image signature, or file exceeds size limit"},
        401: {"description": "Authentication required"},
    },
)
async def upload_image(
    file: UploadFile = File(..., description="Image file (JPG, JPEG, PNG, WEBP, max 5MB)"),
    current_user: User = Depends(get_current_user),
) -> ImageUploadResponse:
    """
    Receives an image upload from an authenticated user,
    validates file type, binary magic bytes, and file size,
    and uploads to Firebase Storage (or local storage fallback).
    """
    image_url, filename, size_bytes = await storage_service.save_image(file, current_user.id)

    return ImageUploadResponse(
        image_url=image_url,
        filename=filename,
        content_type=file.content_type or "image/jpeg",
        size_bytes=size_bytes,
    )
