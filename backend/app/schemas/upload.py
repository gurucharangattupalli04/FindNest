"""
Pydantic v2 schemas for image upload responses.
"""
from pydantic import BaseModel, Field


class ImageUploadResponse(BaseModel):
    """Response model for uploaded images."""
    image_url: str = Field(..., description="Publicly accessible URL of the stored image")
    filename: str = Field(..., description="Collision-free filename stored in storage")
    content_type: str = Field(..., description="MIME content type of the image")
    size_bytes: int = Field(..., description="File size in bytes")
