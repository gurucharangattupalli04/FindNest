"""
Pydantic v2 schemas for FoundItem entity.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import ItemCategory, ItemStatus


class FoundItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Item name or headline")
    category: ItemCategory = Field(default=ItemCategory.OTHER, description="Category classification")
    description: str = Field(..., min_length=1, description="Detailed item description")
    color: Optional[str] = Field(default=None, max_length=50)
    brand: Optional[str] = Field(default=None, max_length=100)
    location: str = Field(..., min_length=1, max_length=255, description="Location where item was discovered")
    storage_location: Optional[str] = Field(
        default=None, max_length=255, description="Holding desk or facility (e.g. Security Office)"
    )
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    date_found: datetime = Field(..., description="Date and time when item was found")
    contact_name: Optional[str] = Field(default=None, max_length=100)
    contact_phone: Optional[str] = Field(default=None, max_length=50)
    contact_email: Optional[str] = Field(default=None, max_length=100)
    image_url: Optional[str] = Field(default=None, max_length=1000)
    status: ItemStatus = Field(default=ItemStatus.ACTIVE)
    is_featured: bool = Field(default=False)


class FoundItemCreate(FoundItemBase):
    user_id: Optional[int] = Field(default=None, description="Finder user ID (set automatically on backend)")
    ai_metadata: Optional[Dict[str, Any]] = Field(default=None, description="Metadata for AI matching")


class FoundItemUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    category: Optional[ItemCategory] = None
    description: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    location: Optional[str] = None
    storage_location: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    date_found: Optional[datetime] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[ItemStatus] = None
    is_featured: Optional[bool] = None
    ai_metadata: Optional[Dict[str, Any]] = None


class FoundItemResponse(FoundItemBase):
    id: int
    user_id: Optional[int] = None
    ai_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedFoundItemsResponse(BaseModel):
    items: List[FoundItemResponse]
    total: int
    page: int
    limit: int
    pages: int
