"""
Notifications API Endpoints for FindNest.
Provides authenticated endpoints for listing, counting unread,
and marking notifications as read with strict user isolation.
"""
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import (
    NotificationResponse,
    PaginatedNotificationsResponse,
    UnreadCountResponse,
    MarkAllReadResponse,
)

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedNotificationsResponse,
    summary="List User Notifications",
    description="Fetch paginated list of notifications for the currently authenticated user.",
)
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    unread_only: bool = Query(False, description="Filter to only unread notifications"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
) -> PaginatedNotificationsResponse:
    base_query = (
        db.query(Notification)
        .options(joinedload(Notification.lost_item), joinedload(Notification.found_item))
        .filter(Notification.user_id == current_user.id)
    )

    unread_count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.is_read.is_(False))
        .count()
    )

    if unread_only:
        base_query = base_query.filter(Notification.is_read.is_(False))

    total = base_query.count()
    pages = math.ceil(total / limit) if total > 0 else 1

    items = (
        base_query.order_by(Notification.created_at.desc(), Notification.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return PaginatedNotificationsResponse(
        items=items,
        total=total,
        unread_count=unread_count,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
    summary="Get Unread Notifications Count",
    description="Lightweight endpoint to fetch the number of unread notifications for the current user.",
)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UnreadCountResponse:
    count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.is_read.is_(False))
        .count()
    )
    return UnreadCountResponse(unread_count=count)


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark Notification as Read",
    description="Mark an individual notification as read. Enforces strict user isolation.",
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationResponse:
    notification = (
        db.query(Notification)
        .options(joinedload(Notification.lost_item), joinedload(Notification.found_item))
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    if not notification.is_read:
        notification.is_read = True
        db.commit()
        db.refresh(notification)

    return notification


@router.post(
    "/mark-all-read",
    response_model=MarkAllReadResponse,
    summary="Mark All Notifications as Read",
    description="Marks all unread notifications for the current user as read.",
)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MarkAllReadResponse:
    marked_count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.is_read.is_(False))
        .update({"is_read": True}, synchronize_session="fetch")
    )
    db.commit()

    return MarkAllReadResponse(
        marked_count=marked_count,
        message=f"Successfully marked {marked_count} notification(s) as read",
    )
