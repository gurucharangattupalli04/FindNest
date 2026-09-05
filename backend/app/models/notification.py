"""
Notification SQLAlchemy ORM model for FindNest.
Supports In-App alerts and Email delivery tracking for Smart AI Matches.
Includes deduplication constraint on (user_id, related_lost_item_id, related_found_item_id).
"""
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, utc_now

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.lost_item import LostItem
    from app.models.found_item import FoundItem


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    notification_type: Mapped[str] = mapped_column(
        String(50), default="smart_match", nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    # Related items
    related_lost_item_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("lost_items.id", ondelete="SET NULL"), nullable=True, index=True
    )
    related_found_item_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("found_items.id", ondelete="SET NULL"), nullable=True, index=True
    )
    match_score: Mapped[float] = mapped_column(Float, nullable=False)

    # In-App read state
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    # Email delivery status
    email_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    email_error: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    # Deduplication constraint: one notification per user per lost/found pair
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "related_lost_item_id",
            "related_found_item_id",
            name="uq_user_lost_found_notification",
        ),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")
    lost_item: Mapped[Optional["LostItem"]] = relationship(
        "LostItem", foreign_keys=[related_lost_item_id]
    )
    found_item: Mapped[Optional["FoundItem"]] = relationship(
        "FoundItem", foreign_keys=[related_found_item_id]
    )

    def __repr__(self) -> str:
        return (
            f"<Notification id={self.id} user_id={self.user_id} "
            f"type={self.notification_type} score={self.match_score} is_read={self.is_read}>"
        )
