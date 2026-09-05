"""
LostItem SQLAlchemy ORM model for FindNest.
Includes full item descriptors, geolocation, reward, user relation, and AI metadata slots.
"""
from datetime import datetime
from typing import Optional, TYPE_CHECKING, List
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Enum as SQLEnum,
    JSON,
    ARRAY,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, utc_now
from app.models.enums import ItemCategory, ItemStatus

if TYPE_CHECKING:
    from app.models.user import User


class LostItem(Base):
    __tablename__ = "lost_items"

    # Primary Identifier
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)

    # Core Item Information
    title: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    category: Mapped[ItemCategory] = mapped_column(
        SQLEnum(ItemCategory, native_enum=False, length=50),
        index=True,
        nullable=False
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(50), index=True, nullable=True)
    brand: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)

    # Location & Date Information
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    date_lost: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Reward & Contact Details
    reward: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    contact_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Image & Storage Scalability
    image_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    image_storage_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Status & Presentation
    status: Mapped[ItemStatus] = mapped_column(
        SQLEnum(ItemStatus, native_enum=False, length=50),
        default=ItemStatus.ACTIVE,
        index=True,
        nullable=False
    )
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # AI Matching & Embedding Metadata Scalability (ready for future image/text vector matching)
    ai_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    embedding: Mapped[Optional[List[float]]] = mapped_column(ARRAY(Float), nullable=True)

    # User Reference (Foreign Key)
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True
    )
    user: Mapped[Optional["User"]] = relationship("User", back_populates="lost_items")

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    # Property alias for item_name
    @property
    def item_name(self) -> str:
        return self.title

    @item_name.setter
    def item_name(self, value: str) -> None:
        self.title = value

    def __repr__(self) -> str:
        return f"<LostItem id={self.id} title='{self.title}' category='{self.category}' status='{self.status}'>"
