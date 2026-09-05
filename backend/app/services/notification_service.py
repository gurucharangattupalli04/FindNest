"""
Notification Service for FindNest.
Orchestrates Smart Match detection, deduplication, In-App notification creation,
and resilient transactional email dispatch for high-confidence matches (>= 75%).
"""
import logging
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.base import utc_now
from app.models.enums import ItemStatus
from app.models.found_item import FoundItem
from app.models.lost_item import LostItem
from app.models.notification import Notification
from app.models.user import User
from app.services.email_service import email_service
from app.services.matching_service import matching_service

logger = logging.getLogger(__name__)


class NotificationService:
    """Service managing Smart Match notifications (In-App + Email)."""

    def __init__(self):
        self.threshold = settings.NOTIFICATION_MATCH_THRESHOLD

    def process_and_notify_matches_for_lost_item(
        self, db: Session, lost_item: LostItem
    ) -> List[Notification]:
        """
        Triggered when a LostItem is created or updated.
        Scans against active FoundItems, evaluates hybrid matches,
        filters by notification threshold (>= 75%), deduplicates,
        and creates in-app notifications and dispatches emails.
        """
        created_notifications: List[Notification] = []
        if lost_item.status != ItemStatus.ACTIVE:
            return created_notifications

        try:
            match_response = matching_service.find_matches_for_lost_item(
                db=db, lost_item=lost_item, limit=20
            )
        except Exception as exc:
            logger.error(
                "[NotificationService] Error calculating matches for lost item %s: %s",
                lost_item.id,
                exc,
                exc_info=True,
            )
            return created_notifications

        for match in match_response.matches:
            if match.score < self.threshold:
                continue

            found_item_id = getattr(match.matched_item, "id", None) or (
                match.matched_item.get("id") if isinstance(match.matched_item, dict) else None
            )
            if not found_item_id:
                continue

            found_item = db.query(FoundItem).filter(FoundItem.id == found_item_id).first()
            if not found_item or found_item.status != ItemStatus.ACTIVE:
                continue

            # 1. Notify Lost Item Owner
            if lost_item.user_id:
                notif = self._notify_user_of_match(
                    db=db,
                    target_user_id=lost_item.user_id,
                    user_role="lost_owner",
                    lost_item=lost_item,
                    found_item=found_item,
                    match_score=match.score,
                    match_reasons=match.reasons,
                )
                if notif:
                    created_notifications.append(notif)

            # 2. Notify Found Item Owner (if different user)
            if found_item.user_id and found_item.user_id != lost_item.user_id:
                notif = self._notify_user_of_match(
                    db=db,
                    target_user_id=found_item.user_id,
                    user_role="found_owner",
                    lost_item=lost_item,
                    found_item=found_item,
                    match_score=match.score,
                    match_reasons=match.reasons,
                )
                if notif:
                    created_notifications.append(notif)

        return created_notifications

    def process_and_notify_matches_for_found_item(
        self, db: Session, found_item: FoundItem
    ) -> List[Notification]:
        """
        Triggered when a FoundItem is created or updated.
        Scans against active LostItems, evaluates hybrid matches,
        filters by notification threshold (>= 75%), deduplicates,
        and creates in-app notifications and dispatches emails.
        """
        created_notifications: List[Notification] = []
        if found_item.status != ItemStatus.ACTIVE:
            return created_notifications

        try:
            match_response = matching_service.find_matches_for_found_item(
                db=db, found_item=found_item, limit=20
            )
        except Exception as exc:
            logger.error(
                "[NotificationService] Error calculating matches for found item %s: %s",
                found_item.id,
                exc,
                exc_info=True,
            )
            return created_notifications

        for match in match_response.matches:
            if match.score < self.threshold:
                continue

            lost_item_id = getattr(match.matched_item, "id", None) or (
                match.matched_item.get("id") if isinstance(match.matched_item, dict) else None
            )
            if not lost_item_id:
                continue

            lost_item = db.query(LostItem).filter(LostItem.id == lost_item_id).first()
            if not lost_item or lost_item.status != ItemStatus.ACTIVE:
                continue

            # 1. Notify Lost Item Owner
            if lost_item.user_id:
                notif = self._notify_user_of_match(
                    db=db,
                    target_user_id=lost_item.user_id,
                    user_role="lost_owner",
                    lost_item=lost_item,
                    found_item=found_item,
                    match_score=match.score,
                    match_reasons=match.reasons,
                )
                if notif:
                    created_notifications.append(notif)

            # 2. Notify Found Item Owner (if different user)
            if found_item.user_id and found_item.user_id != lost_item.user_id:
                notif = self._notify_user_of_match(
                    db=db,
                    target_user_id=found_item.user_id,
                    user_role="found_owner",
                    lost_item=lost_item,
                    found_item=found_item,
                    match_score=match.score,
                    match_reasons=match.reasons,
                )
                if notif:
                    created_notifications.append(notif)

        return created_notifications

    def _notify_user_of_match(
        self,
        db: Session,
        target_user_id: int,
        user_role: str,  # "lost_owner" or "found_owner"
        lost_item: LostItem,
        found_item: FoundItem,
        match_score: float,
        match_reasons: Optional[List[str]],
    ) -> Optional[Notification]:
        """
        Creates in-app Notification record in DB with deduplication check,
        and dispatches email safely.
        """
        # Deduplication check: (target_user_id, lost_item.id, found_item.id)
        existing = (
            db.query(Notification)
            .filter(
                Notification.user_id == target_user_id,
                Notification.related_lost_item_id == lost_item.id,
                Notification.related_found_item_id == found_item.id,
            )
            .first()
        )
        if existing:
            logger.info(
                "[NotificationService] Notification already exists for user %s, lost %s, found %s. Skipping.",
                target_user_id,
                lost_item.id,
                found_item.id,
            )
            return None

        score_int = int(round(match_score))
        if user_role == "lost_owner":
            title = f"🎯 Smart AI Match: Found item matches your '{lost_item.title}'"
            message = (
                f"A found item '{found_item.title}' was reported at {found_item.location} "
                f"with a {score_int}% match confidence to your lost '{lost_item.title}'."
            )
            user_item_title = lost_item.title
            user_item_type = "lost"
            matched_item = found_item
        else:
            title = f"🎯 Smart AI Match: Your found '{found_item.title}' matches a lost report"
            message = (
                f"Your found item '{found_item.title}' matches a lost report for '{lost_item.title}' "
                f"with a {score_int}% match confidence."
            )
            user_item_title = found_item.title
            user_item_type = "found"
            matched_item = lost_item

        # 1. Create In-App Notification
        notification = Notification(
            user_id=target_user_id,
            notification_type="smart_match",
            title=title,
            message=message,
            related_lost_item_id=lost_item.id,
            related_found_item_id=found_item.id,
            match_score=round(match_score, 2),
            is_read=False,
            email_sent=False,
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

        # 2. Dispatch Email (Resilient & Non-Blocking)
        try:
            target_user = db.query(User).filter(User.id == target_user_id).first()
            recipient_email = target_user.email if target_user else None
            recipient_name = target_user.full_name if target_user else None

            # Fallback to contact info on the item if user object has no email
            if not recipient_email:
                if user_role == "lost_owner":
                    recipient_email = lost_item.contact_email
                    recipient_name = recipient_name or lost_item.contact_name
                else:
                    recipient_email = found_item.contact_email
                    recipient_name = recipient_name or found_item.contact_name

            if recipient_email:
                date_str = None
                if hasattr(matched_item, "date_found") and matched_item.date_found:
                    date_str = matched_item.date_found.strftime("%b %d, %Y")
                elif hasattr(matched_item, "date_lost") and matched_item.date_lost:
                    date_str = matched_item.date_lost.strftime("%b %d, %Y")

                category_val = (
                    matched_item.category.value
                    if hasattr(matched_item.category, "value")
                    else str(matched_item.category)
                )

                email_sent = email_service.send_smart_match_email(
                    to_email=recipient_email,
                    to_name=recipient_name,
                    user_item_title=user_item_title,
                    user_item_type=user_item_type,
                    matched_item_id=matched_item.id,
                    matched_item_title=matched_item.title,
                    matched_item_category=category_val,
                    matched_item_location=matched_item.location,
                    matched_item_date=date_str,
                    matched_item_image=matched_item.image_url,
                    match_score=match_score,
                    match_reasons=match_reasons,
                )

                if email_sent:
                    notification.email_sent = True
                    notification.email_sent_at = utc_now()
                    notification.email_error = None
                else:
                    notification.email_sent = False
                    notification.email_error = "Email provider dispatch failed"

                db.commit()
                db.refresh(notification)

        except Exception as exc:
            logger.error(
                "[NotificationService] Error sending email for notification %s: %s",
                notification.id,
                exc,
                exc_info=True,
            )
            try:
                notification.email_sent = False
                notification.email_error = str(exc)[:500]
                db.commit()
            except Exception:
                pass

        return notification


notification_service = NotificationService()
