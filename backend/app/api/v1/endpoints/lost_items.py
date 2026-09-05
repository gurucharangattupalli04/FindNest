"""
Lost Items CRUD API endpoints for FindNest.
Includes full creation, listing with multi-field search and pagination,
individual retrieval, and owner-restricted updates and deletions.
"""
import logging
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.enums import ItemCategory, ItemStatus
from app.models.lost_item import LostItem
from app.models.user import User
from app.schemas.lost_item import (
    LostItemCreate,
    LostItemResponse,
    LostItemUpdate,
    PaginatedLostItemsResponse,
)
from app.schemas.matching import ItemMatchesResponse
from app.services.embedding_service import embedding_service
from app.services.matching_service import matching_service
from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "",
    response_model=LostItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Lost Item Report",
    description="Publishes a new lost item report. Requires authentication.",
)
def create_lost_item(
    item_in: LostItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LostItem:
    # Use contact info from user profile if not explicitly provided in form
    contact_name = item_in.contact_name or current_user.full_name or "Community Member"
    contact_email = item_in.contact_email or current_user.email
    contact_phone = item_in.contact_phone or current_user.phone_number

    new_item = LostItem(
        title=item_in.title.strip(),
        category=item_in.category,
        description=item_in.description.strip(),
        color=item_in.color.strip() if item_in.color else None,
        brand=item_in.brand.strip() if item_in.brand else None,
        location=item_in.location.strip(),
        latitude=item_in.latitude,
        longitude=item_in.longitude,
        date_lost=item_in.date_lost,
        reward=item_in.reward.strip() if item_in.reward else None,
        contact_name=contact_name,
        contact_phone=contact_phone,
        contact_email=contact_email,
        image_url=item_in.image_url,
        status=item_in.status,
        is_featured=item_in.is_featured,
        ai_metadata=item_in.ai_metadata,
        user_id=current_user.id,
    )

    db.add(new_item)
    embedding_service.generate_item_embedding(new_item)
    db.commit()
    db.refresh(new_item)

    # Process and notify smart matches asynchronously/safely
    try:
        notification_service.process_and_notify_matches_for_lost_item(db, new_item)
    except Exception as notif_err:
        logger.error(
            "Failed processing smart match notifications for lost item %s: %s",
            new_item.id,
            notif_err,
            exc_info=True,
        )

    return new_item


@router.get(
    "",
    response_model=PaginatedLostItemsResponse,
    summary="List Lost Items",
    description="Public list of lost items with search, categorization, and pagination.",
)
def list_lost_items(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None, description="Search across title, description, brand, color, location"),
    category: Optional[ItemCategory] = Query(None, description="Filter by category"),
    location: Optional[str] = Query(None, description="Filter by location substring"),
    status: Optional[ItemStatus] = Query(None, description="Filter by status (e.g. active, resolved)"),
    user_id: Optional[int] = Query(None, description="Filter by owner user ID"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
) -> PaginatedLostItemsResponse:
    query = db.query(LostItem)

    # Search keyword filtering across title, description, brand, color, and location
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                LostItem.title.ilike(term),
                LostItem.description.ilike(term),
                LostItem.brand.ilike(term),
                LostItem.color.ilike(term),
                LostItem.location.ilike(term),
            )
        )

    # Exact and substring filters
    if category:
        query = query.filter(LostItem.category == category)
    if location and location.strip():
        query = query.filter(LostItem.location.ilike(f"%{location.strip()}%"))
    if status:
        query = query.filter(LostItem.status == status)
    if user_id is not None:
        query = query.filter(LostItem.user_id == user_id)

    total = query.count()
    pages = max(1, math.ceil(total / limit)) if total > 0 else 1

    # Order newest first and paginate
    items = (
        query.order_by(LostItem.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return PaginatedLostItemsResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get(
    "/{item_id}",
    response_model=LostItemResponse,
    summary="Get Single Lost Item",
    description="Retrieves complete information for a specific lost item.",
)
def get_lost_item(
    item_id: int,
    db: Session = Depends(get_db),
) -> LostItem:
    item = db.query(LostItem).filter(LostItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lost item with ID {item_id} was not found.",
        )
    return item


@router.put(
    "/{item_id}",
    response_model=LostItemResponse,
    summary="Update Lost Item",
    description="Updates a lost item report. Requires authentication and ownership.",
)
def update_lost_item(
    item_id: int,
    item_in: LostItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LostItem:
    item = db.query(LostItem).filter(LostItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lost item with ID {item_id} was not found.",
        )

    # Ownership check: only the author can update
    if item.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this item.",
        )

    update_data = item_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    embedding_service.generate_item_embedding(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete(
    "/{item_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Lost Item",
    description="Permanently deletes a lost item report. Requires authentication and ownership.",
)
def delete_lost_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    item = db.query(LostItem).filter(LostItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lost item with ID {item_id} was not found.",
        )

    # Ownership check: only the author can delete
    if item.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this item.",
        )

    db.delete(item)
    db.commit()
    return {"message": "Lost item deleted successfully.", "id": item_id}


@router.get(
    "/{item_id}/matches",
    response_model=ItemMatchesResponse,
    summary="Find Smart AI Matches for Lost Item",
    description="Analyzes active found items using the 5-factor hybrid scoring engine and returns explainable matches >= 35% confidence.",
)
def get_lost_item_matches(
    item_id: int,
    limit: int = Query(10, ge=1, le=50, description="Maximum number of matches to return"),
    db: Session = Depends(get_db),
) -> ItemMatchesResponse:
    item = db.query(LostItem).filter(LostItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lost item with ID {item_id} was not found.",
        )

    return matching_service.find_matches_for_lost_item(db=db, lost_item=item, limit=limit)
