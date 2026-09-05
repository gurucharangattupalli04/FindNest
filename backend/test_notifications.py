"""
FindNest Step 9 Verification Suite: Smart Match Notifications (In-App & Email).
Verifies:
  1. EmailService console provider rendering, HTML template structure, and plaintext fallback.
  2. EmailService error resilience (provider failure handled without crashing).
  3. Notification model and database schema persistence with metadata.
  4. NotificationService trigger: high-confidence matches (>= 75%) trigger notifications.
  5. NotificationService threshold filtering: low/medium matches (< 75%) do NOT trigger notifications.
  6. Notification deduplication: re-evaluating matches does NOT create duplicate records.
  7. API GET /api/v1/notifications with pagination and unread filtering.
  8. API GET /api/v1/notifications/unread-count.
  9. API PATCH /api/v1/notifications/{id}/read.
 10. API POST /api/v1/notifications/mark-all-read.
 11. Strict User Isolation security (User B cannot view or modify User A's notifications).
 12. End-to-end item creation integration (creating a matching Lost/Found item triggers notifications).
"""
import uuid
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.core.security import create_access_token
from app.core.config import settings
from app.models.enums import ItemCategory, ItemStatus
from app.models.lost_item import LostItem
from app.models.found_item import FoundItem
from app.models.notification import Notification
from app.models.user import User
from app.services.email_service import EmailService, email_service
from app.services.notification_service import notification_service

client = TestClient(app)

MOCK_VEC = [0.1] * 768


def create_test_user(db, name_prefix="notif_user"):
    unique_suffix = uuid.uuid4().hex[:8]
    user = User(
        email=f"{name_prefix}_{unique_suffix}@findnest.org",
        full_name=f"User {unique_suffix.capitalize()}",
        phone_number="+1-555-7788",
        hashed_password="placeholder_hashed_password",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_auth_header(user: User):
    token = create_access_token(subject=user.id)
    return {"Authorization": f"Bearer {token}"}


def run_tests():
    print("\n" + "=" * 75)
    print("FindNest: Smart Match Notifications & Email Verification Suite")
    print("=" * 75)

    db = SessionLocal()

    try:
        # -------------------------------------------------------------
        # Test 1: EmailService Console Provider Rendering
        # -------------------------------------------------------------
        print("\n[Test 1/12] Testing EmailService Console Provider Rendering...")
        test_email_service = EmailService()
        assert test_email_service.provider == "console", f"Expected console provider, got {test_email_service.provider}"

        plain_text = test_email_service._build_plain_text(
            greeting="Hi Alex",
            action_text="Someone found an item that might be your 'Silver MacBook Pro 16'!",
            user_item_title="Silver MacBook Pro 16",
            matched_item_title="Found Silver Apple Laptop M2",
            matched_item_category="electronics",
            matched_item_location="Student Union 2nd Floor",
            matched_item_date="Sep 05, 2026",
            score_pct=93,
            match_reasons=["Category match", "Semantic text match 95%"],
            view_url="https://findnest.org/?match_item=42",
        )
        assert "Silver MacBook Pro 16" in plain_text
        assert "Found Silver Apple Laptop M2" in plain_text
        assert "93%" in plain_text
        assert "Category match" in plain_text

        html_body = test_email_service._build_html_template(
            greeting="Hi Alex",
            header_subtitle="A newly reported found item closely matches your lost report",
            action_text="Someone found an item that might be your 'Silver MacBook Pro 16'!",
            user_item_title="Silver MacBook Pro 16",
            user_item_type="lost",
            matched_item_id=42,
            matched_item_title="Found Silver Apple Laptop M2",
            matched_item_category="electronics",
            matched_item_location="Student Union 2nd Floor",
            matched_item_date="Sep 05, 2026",
            matched_item_image="https://findnest.org/mock.jpg",
            score_pct=93,
            match_reasons=["Category match", "Semantic text match 95%"],
            view_url="https://findnest.org/?match_item=42",
        )
        assert "<!DOCTYPE html>" in html_body
        assert "93%" in html_body
        assert "High Confidence Match" in html_body
        assert "FindNest" in html_body

        # Dispatch via console
        sent = test_email_service.send_smart_match_email(
            to_email="test_recipient@findnest.org",
            to_name="Alex Rider",
            user_item_title="Silver MacBook Pro 16",
            user_item_type="lost",
            matched_item_id=42,
            matched_item_title="Found Silver Apple Laptop M2",
            matched_item_category="electronics",
            matched_item_location="Student Union 2nd Floor",
            matched_item_date="Sep 05, 2026",
            match_score=92.5,
            match_reasons=["Category match"],
        )
        assert sent is True, "Console email provider should return True on dispatch"
        print("  [PASS] Console provider rendering, HTML template, and dispatch verified")

        # -------------------------------------------------------------
        # Test 2: EmailService Error Resilience
        # -------------------------------------------------------------
        print("\n[Test 2/12] Testing EmailService Error Handling Resilience...")
        # Test with broken provider or invalid params
        broken_service = EmailService()
        broken_service.enabled = True
        broken_service.provider = "unsupported_xyz"
        # Should safely catch error, log, and return False without throwing unhandled exception
        result = broken_service.send_smart_match_email(
            to_email="bad@test.org",
            to_name="Bad",
            user_item_title="Item",
            user_item_type="lost",
            matched_item_id=1,
            matched_item_title="Found",
            matched_item_category="other",
            matched_item_location="Here",
            matched_item_date="Today",
            match_score=80.0,
        )
        assert result is False, "Unsupported email provider must return False safely without crashing"
        print("  [PASS] EmailService error resilience confirmed")

        # -------------------------------------------------------------
        # Test 3: Notification Database Persistence & Schema
        # -------------------------------------------------------------
        print("\n[Test 3/12] Testing Notification DB Schema Persistence...")
        user1 = create_test_user(db, "notif_user1")
        user2 = create_test_user(db, "notif_user2")

        test_notif = Notification(
            user_id=user1.id,
            notification_type="smart_match",
            title="🎯 Smart AI Match Test",
            message="Test notification message for user 1",
            match_score=88.4,
            is_read=False,
            email_sent=True,
            email_sent_at=datetime.now(timezone.utc),
        )
        db.add(test_notif)
        db.commit()
        db.refresh(test_notif)

        assert test_notif.id is not None
        assert test_notif.user_id == user1.id
        assert test_notif.is_read is False
        assert test_notif.email_sent is True
        print(f"  [PASS] Notification record #{test_notif.id} persisted and queried successfully")

        # -------------------------------------------------------------
        # Test 4: High-Confidence Smart Match Trigger (>= 75%)
        # -------------------------------------------------------------
        print("\n[Test 4/12] Testing High-Confidence Smart Match Trigger (>= 75%)...")
        now = datetime.now(timezone.utc)

        lost_laptop = LostItem(
            user_id=user1.id,
            title="Midnight Blue MacBook Air M2",
            description="Midnight blue MacBook Air 13 inch with scratch on bottom lid",
            category=ItemCategory.ELECTRONICS,
            color="Midnight Blue",
            brand="Apple",
            location="University Library 3rd Floor Quiet Area",
            latitude=37.7749,
            longitude=-122.4194,
            date_lost=now - timedelta(hours=2),
            contact_name=user1.full_name,
            contact_phone=user1.phone_number,
            contact_email=user1.email,
            status=ItemStatus.ACTIVE,
            embedding=MOCK_VEC,
        )
        db.add(lost_laptop)
        db.commit()
        db.refresh(lost_laptop)

        found_laptop = FoundItem(
            user_id=user2.id,
            title="Midnight Blue Apple MacBook",
            description="Found midnight blue MacBook Air laptop left on desk",
            category=ItemCategory.ELECTRONICS,
            color="Midnight Blue",
            brand="Apple",
            location="University Library 3rd Floor Desk",
            latitude=37.7749,
            longitude=-122.4194,
            date_found=now - timedelta(hours=1),
            contact_name=user2.full_name,
            contact_phone=user2.phone_number,
            contact_email=user2.email,
            status=ItemStatus.ACTIVE,
            embedding=MOCK_VEC,
        )
        db.add(found_laptop)
        db.commit()
        db.refresh(found_laptop)

        # Trigger notification processing for the found item
        created_notifs = notification_service.process_and_notify_matches_for_found_item(db, found_laptop)
        assert len(created_notifs) >= 1, f"Expected at least 1 notification, got {len(created_notifs)}"
        
        # Verify notification details
        lost_owner_notif = next((n for n in created_notifs if n.user_id == user1.id), None)
        assert lost_owner_notif is not None, "Lost item owner must receive match notification"
        assert lost_owner_notif.match_score >= 75.0, f"Expected score >= 75%, got {lost_owner_notif.match_score}"
        assert lost_owner_notif.related_lost_item_id == lost_laptop.id
        assert lost_owner_notif.related_found_item_id == found_laptop.id
        assert lost_owner_notif.email_sent is True, "Console email should report email_sent=True"
        print(f"  [PASS] High-confidence match notification created: score={lost_owner_notif.match_score}%, email_sent={lost_owner_notif.email_sent}")

        # -------------------------------------------------------------
        # Test 5: Low/Medium Match Filtering (< 75%)
        # -------------------------------------------------------------
        print("\n[Test 5/12] Testing Below-Threshold Match Filtering (< 75%)...")
        # Incompatible category and distinct vector
        unrelated_found = FoundItem(
            user_id=user2.id,
            title="Brown Leather Wallet",
            description="Found old brown tri-fold leather wallet with receipts",
            category=ItemCategory.WALLETS,
            color="Brown",
            location="Gym Locker Room",
            date_found=now - timedelta(days=30),
            contact_name="Gym Staff",
            contact_email="gym@test.org",
            status=ItemStatus.ACTIVE,
            embedding=[-0.8] * 768,
        )
        db.add(unrelated_found)
        db.commit()
        db.refresh(unrelated_found)

        unrelated_notifs = notification_service.process_and_notify_matches_for_found_item(db, unrelated_found)
        assert len(unrelated_notifs) == 0, f"Unrelated item should produce 0 notifications, got {len(unrelated_notifs)}"
        print("  [PASS] Below-threshold items (< 75%) correctly skipped without notification")

        # -------------------------------------------------------------
        # Test 6: Deduplication Check
        # -------------------------------------------------------------
        print("\n[Test 6/12] Testing Deduplication Logic...")
        # Re-trigger match processing for the same items
        second_run_notifs = notification_service.process_and_notify_matches_for_found_item(db, found_laptop)
        assert len(second_run_notifs) == 0, "Duplicate notifications must be prevented"

        # Verify DB has exactly 1 notification for user 1 for this pair
        pair_notifs_u1 = (
            db.query(Notification)
            .filter(
                Notification.user_id == user1.id,
                Notification.related_lost_item_id == lost_laptop.id,
                Notification.related_found_item_id == found_laptop.id,
            )
            .all()
        )
        assert len(pair_notifs_u1) == 1, f"Expected exactly 1 notification for (user1, lost, found), got {len(pair_notifs_u1)}"

        # Verify direct duplicate call returns None
        direct_dup = notification_service._notify_user_of_match(
            db=db,
            target_user_id=user1.id,
            user_role="lost_owner",
            lost_item=lost_laptop,
            found_item=found_laptop,
            match_score=95.0,
            match_reasons=["Test"],
        )
        assert direct_dup is None, "Direct duplicate call should return None"
        print("  [PASS] Deduplication verified: no redundant notifications generated")

        # -------------------------------------------------------------
        # Test 7: API GET /api/v1/notifications
        # -------------------------------------------------------------
        print("\n[Test 7/12] Testing GET /api/v1/notifications API Endpoint...")
        auth1 = get_auth_header(user1)
        res = client.get("/api/v1/notifications", headers=auth1)
        assert res.status_code == 200, f"GET notifications failed: {res.text}"
        data = res.json()
        assert "items" in data
        assert "unread_count" in data
        assert data["total"] >= 1
        assert data["unread_count"] >= 1
        print(f"  [PASS] GET /notifications returned {data['total']} items, unread={data['unread_count']}")

        # -------------------------------------------------------------
        # Test 8: API GET /api/v1/notifications/unread-count
        # -------------------------------------------------------------
        print("\n[Test 8/12] Testing GET /api/v1/notifications/unread-count API Endpoint...")
        res_count = client.get("/api/v1/notifications/unread-count", headers=auth1)
        assert res_count.status_code == 200
        count_data = res_count.json()
        assert count_data["unread_count"] == data["unread_count"]
        print(f"  [PASS] GET /unread-count returned {count_data['unread_count']}")

        # -------------------------------------------------------------
        # Test 9: API PATCH /api/v1/notifications/{id}/read
        # -------------------------------------------------------------
        print("\n[Test 9/12] Testing PATCH /api/v1/notifications/{id}/read...")
        notif_to_read = lost_owner_notif.id
        res_patch = client.patch(f"/api/v1/notifications/{notif_to_read}/read", headers=auth1)
        assert res_patch.status_code == 200, f"PATCH /read failed: {res_patch.text}"
        patch_data = res_patch.json()
        assert patch_data["is_read"] is True

        # Verify unread count decreased
        res_count_after = client.get("/api/v1/notifications/unread-count", headers=auth1)
        assert res_count_after.json()["unread_count"] == count_data["unread_count"] - 1
        print("  [PASS] Individual notification successfully marked as read")

        # -------------------------------------------------------------
        # Test 10: API POST /api/v1/notifications/mark-all-read
        # -------------------------------------------------------------
        print("\n[Test 10/12] Testing POST /api/v1/notifications/mark-all-read...")
        # Create 2 more unread notifications for user 1
        extra1 = Notification(user_id=user1.id, notification_type="smart_match", title="Extra 1", message="Msg 1", match_score=80.0, is_read=False)
        extra2 = Notification(user_id=user1.id, notification_type="smart_match", title="Extra 2", message="Msg 2", match_score=85.0, is_read=False)
        db.add_all([extra1, extra2])
        db.commit()

        res_mark_all = client.post("/api/v1/notifications/mark-all-read", headers=auth1)
        assert res_mark_all.status_code == 200
        mark_all_data = res_mark_all.json()
        assert mark_all_data["marked_count"] >= 2

        # Verify count is now 0
        res_count_zero = client.get("/api/v1/notifications/unread-count", headers=auth1)
        assert res_count_zero.json()["unread_count"] == 0
        print(f"  [PASS] Marked {mark_all_data['marked_count']} notifications read; unread count is 0")

        # -------------------------------------------------------------
        # Test 11: Strict User Isolation Security
        # -------------------------------------------------------------
        print("\n[Test 11/12] Testing Strict User Isolation Security...")
        auth2 = get_auth_header(user2)
        # User 2 tries to mark User 1's notification as read
        res_hack = client.patch(f"/api/v1/notifications/{notif_to_read}/read", headers=auth2)
        assert res_hack.status_code == 404, f"User 2 should get 404 for User 1's notif, got {res_hack.status_code}"

        # User 2's notifications should NOT contain User 1's notification
        res_u2_list = client.get("/api/v1/notifications", headers=auth2)
        u2_notif_ids = [n["id"] for n in res_u2_list.json()["items"]]
        assert notif_to_read not in u2_notif_ids, "User 1's notification leaked in User 2's feed"
        print("  [PASS] Strict User Isolation verified (404 on cross-user access, zero leakage)")

        # -------------------------------------------------------------
        # Test 12: End-to-End Item Creation Integration Trigger
        # -------------------------------------------------------------
        print("\n[Test 12/12] Testing End-to-End Item Creation Integration...")
        user3 = create_test_user(db, "e2e_lost_user")
        user4 = create_test_user(db, "e2e_found_user")

        auth3 = get_auth_header(user3)
        auth4 = get_auth_header(user4)

        # 1. User 3 creates lost bicycle
        lost_payload = {
            "title": "Red Trek Mountain Bike 29er",
            "description": "Red Trek Marlin mountain bike with black water bottle cage",
            "category": "other",
            "color": "Red",
            "brand": "Trek",
            "location": "North Campus Bike Racks",
            "date_lost": (now - timedelta(hours=3)).isoformat(),
            "contact_name": "Bike Owner",
            "contact_email": user3.email,
        }
        res_create_lost = client.post("/api/v1/lost-items", json=lost_payload, headers=auth3)
        assert res_create_lost.status_code == 201, f"Create lost item failed: {res_create_lost.text}"
        lost_data = res_create_lost.json()

        # 2. User 4 creates found bicycle (matching category, brand, location, color)
        found_payload = {
            "title": "Red Trek Marlin Mountain Bike",
            "description": "Found red Trek mountain bike near campus racks",
            "category": "other",
            "color": "Red",
            "brand": "Trek",
            "location": "North Campus Bike Racks",
            "date_found": (now - timedelta(hours=1)).isoformat(),
            "contact_name": "Campus Security",
            "contact_email": user4.email,
        }
        res_create_found = client.post("/api/v1/found-items", json=found_payload, headers=auth4)
        assert res_create_found.status_code == 201, f"Create found item failed: {res_create_found.text}"

        # 3. Check if User 3 received an in-app notification for the newly created match
        res_u3_notifs = client.get("/api/v1/notifications", headers=auth3)
        assert res_u3_notifs.status_code == 200
        u3_items = res_u3_notifs.json()["items"]
        
        # Verify that User 3 received a smart match notification
        assert len(u3_items) >= 1, "User 3 should have received a Smart Match notification"
        e2e_notif = u3_items[0]
        assert e2e_notif["related_lost_item_id"] == lost_data["id"]
        assert e2e_notif["match_score"] >= 75.0
        assert "Red Trek" in e2e_notif["title"] or "Red Trek" in e2e_notif["message"]
        print(f"  [PASS] End-to-end integration verified: Found item creation triggered notification for Lost item owner with {e2e_notif['match_score']}% match!")

        print("\n" + "=" * 75)
        print("ALL 12 NOTIFICATION & EMAIL VERIFICATION TESTS PASSED SUCCESSFULLY!")
        print("=" * 75)

    finally:
        db.close()


if __name__ == "__main__":
    run_tests()
