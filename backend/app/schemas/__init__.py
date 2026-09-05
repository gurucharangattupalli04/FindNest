"""Pydantic schemas package for FindNest"""
from app.schemas.health import HealthResponse
from app.schemas.enums import ItemCategory, ItemStatus
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserInDB,
)
from app.schemas.lost_item import (
    LostItemBase,
    LostItemCreate,
    LostItemUpdate,
    LostItemResponse,
    PaginatedLostItemsResponse,
)
from app.schemas.found_item import (
    FoundItemBase,
    FoundItemCreate,
    FoundItemUpdate,
    FoundItemResponse,
    PaginatedFoundItemsResponse,
)
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    TokenPayload,
)
from app.schemas.upload import ImageUploadResponse
from app.schemas.notification import (
    NotificationItemBrief,
    NotificationResponse,
    PaginatedNotificationsResponse,
    UnreadCountResponse,
    MarkAllReadResponse,
)

__all__ = [
    "HealthResponse",
    "ItemCategory",
    "ItemStatus",
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserInDB",
    "LostItemBase",
    "LostItemCreate",
    "LostItemUpdate",
    "LostItemResponse",
    "PaginatedLostItemsResponse",
    "FoundItemBase",
    "FoundItemCreate",
    "FoundItemUpdate",
    "FoundItemResponse",
    "PaginatedFoundItemsResponse",
    "RegisterRequest",
    "LoginRequest",
    "TokenResponse",
    "TokenPayload",
    "ImageUploadResponse",
    "NotificationItemBrief",
    "NotificationResponse",
    "PaginatedNotificationsResponse",
    "UnreadCountResponse",
    "MarkAllReadResponse",
]
