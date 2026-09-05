"""
Pydantic v2 schemas for Notification entity in FindNest.
Provides serialization for In-App and Email notifications.
Strictly excludes any raw 768-dim embeddings.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import ItemCategory, ItemStatus


class NotificationItemBrief(BaseModel):
    """Brief metadata for a lost or found item attached to a notification."""
    id: int
    title: str
    category: ItemCategory
    image_url: Optional[str] = None
    location: str
    status: ItemStatus

    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    """Full notification response payload."""
    id: int
    user_id: int
    notification_type: str = "smart_match"
    title: str
    message: str
    related_lost_item_id: Optional[int] = None
    related_found_item_id: Optional[int] = None
    match_score: float
    is_read: bool = False
    email_sent: bool = False
    email_sent_at: Optional[datetime] = None
    email_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    related_lost_item: Optional[NotificationItemBrief] = Field(
        default=None,
        validation_alias="lost_item",
        serialization_alias="related_lost_item"
    )
    related_found_item: Optional[NotificationItemBrief] = Field(
        default=None,
        validation_alias="found_item",
        serialization_alias="related_found_item"
    )

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PaginatedNotificationsResponse(BaseModel):
    """Paginated list of notifications with unread count summary."""
    items: List[NotificationResponse]
    total: int
    unread_count: int
    page: int
    limit: int
    pages: int


class UnreadCountResponse(BaseModel):
    """Unread count lightweight response."""
    unread_count: int


class MarkAllReadResponse(BaseModel):
    """Response returned when marking all notifications as read."""
    marked_count: int
    message: str
