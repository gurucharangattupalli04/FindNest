"""
FindNest Step 11: Edge-Case, Security & Resiliency Verification Suite.
Tests negative scenarios, unauthorized access, cross-user isolation,
boundary validations, 404 handlers, duplicates, and upload limits.
"""
import io
import uuid
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.notification import Notification

client = TestClient(app)

JPEG_HEADER = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00" + b"\x00" * 40

def run_edge_cases_test():
    print("=" * 70)
    print("FindNest: Step 11 Edge-Case, Security & Resiliency Suite")
    print("=" * 70)

    # -------------------------------------------------------------
    # 1. Unauthorized Access Tests
    # -------------------------------------------------------------
    print("\n[Group 1/7] Testing Unauthorized Access (Missing Bearer Token)...")
    
    r = client.get("/api/v1/auth/me")
    assert r.status_code == 401, f"Expected 401 for /auth/me, got {r.status_code}"

    r = client.post("/api/v1/lost-items", json={"title": "Test", "description": "Test", "location": "Test", "date_lost": "2026-09-05T12:00:00Z"})
    assert r.status_code == 401, f"Expected 401 for /lost-items, got {r.status_code}"

    r = client.post("/api/v1/found-items", json={"title": "Test", "description": "Test", "location": "Test", "date_found": "2026-09-05T12:00:00Z"})
    assert r.status_code == 401, f"Expected 401 for /found-items, got {r.status_code}"

    r = client.post("/api/v1/upload/image", files={"file": ("photo.jpg", JPEG_HEADER, "image/jpeg")})
    assert r.status_code == 401, f"Expected 401 for /upload/image, got {r.status_code}"

    r = client.get("/api/v1/notifications")
    assert r.status_code == 401, f"Expected 401 for /notifications, got {r.status_code}"

    r = client.get("/api/v1/notifications/unread-count")
    assert r.status_code == 401, f"Expected 401 for /notifications/unread-count, got {r.status_code}"

    r = client.post("/api/v1/notifications/mark-all-read")
    assert r.status_code == 401, f"Expected 401 for /notifications/mark-all-read, got {r.status_code}"

    print("  [PASS] All 7 protected endpoints rejected unauthenticated requests with HTTP 401.")

    # -------------------------------------------------------------
    # Setup Test Users
    # -------------------------------------------------------------
    suffix = uuid.uuid4().hex[:8]
    user_a_email = f"user_a_{suffix}@example.com"
    user_b_email = f"user_b_{suffix}@example.com"
    password = "SecurePassword123!"

    # Register User A
    r_a = client.post("/api/v1/auth/register", json={"email": user_a_email, "full_name": "User Alpha", "password": password})
    assert r_a.status_code == 201
    token_a = client.post("/api/v1/auth/login", json={"email": user_a_email, "password": password}).json()["access_token"]
    auth_a = {"Authorization": f"Bearer {token_a}"}

    # Register User B
    r_b = client.post("/api/v1/auth/register", json={"email": user_b_email, "full_name": "User Beta", "password": password})
    assert r_b.status_code == 201
    user_b_id = r_b.json()["id"]
    token_b = client.post("/api/v1/auth/login", json={"email": user_b_email, "password": password}).json()["access_token"]
    auth_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a lost item and a found item
    lost_a = client.post("/api/v1/lost-items", headers=auth_a, json={
        "title": "Alpha Diamond Ring",
        "category": "accessories",
        "description": "Platinum band with single diamond",
        "location": "Main Hall",
        "date_lost": "2026-09-05T10:00:00Z"
    }).json()
    lost_a_id = lost_a["id"]

    found_a = client.post("/api/v1/found-items", headers=auth_a, json={
        "title": "Alpha Gold Key",
        "category": "keys",
        "description": "Gold brass key",
        "location": "East Wing",
        "date_found": "2026-09-05T10:00:00Z"
    }).json()
    found_a_id = found_a["id"]

    # -------------------------------------------------------------
    # 2. Wrong-User / Cross-User Authorization Isolation
    # -------------------------------------------------------------
    print("\n[Group 2/7] Testing Cross-User Authorization Isolation (Wrong-User Mod/Del)...")

    # User B tries to update User A's lost item
    r = client.put(f"/api/v1/lost-items/{lost_a_id}", headers=auth_b, json={"title": "Hacked Title"})
    assert r.status_code == 403, f"Expected 403 Forbidden, got {r.status_code}"

    # User B tries to delete User A's lost item
    r = client.delete(f"/api/v1/lost-items/{lost_a_id}", headers=auth_b)
    assert r.status_code == 403, f"Expected 403 Forbidden, got {r.status_code}"

    # User B tries to update User A's found item
    r = client.put(f"/api/v1/found-items/{found_a_id}", headers=auth_b, json={"title": "Hacked Title"})
    assert r.status_code == 403, f"Expected 403 Forbidden, got {r.status_code}"

    # User B tries to delete User A's found item
    r = client.delete(f"/api/v1/found-items/{found_a_id}", headers=auth_b)
    assert r.status_code == 403, f"Expected 403 Forbidden, got {r.status_code}"

    # Create a notification owned by User A
    db = SessionLocal()
    notif_a = Notification(
        user_id=r_a.json()["id"],
        notification_type="smart_match",
        title="Test Notification For A",
        message="Alpha test notification",
        match_score=85.0,
        is_read=False,
    )
    db.add(notif_a)
    db.commit()
    db.refresh(notif_a)
    notif_a_id = notif_a.id
    db.close()

    # User B tries to mark User A's notification as read
    r = client.patch(f"/api/v1/notifications/{notif_a_id}/read", headers=auth_b)
    assert r.status_code == 404, f"Expected 404 for cross-user notification read, got {r.status_code}"

    print("  [PASS] Cross-user update, delete, and notification access strictly blocked (403/404).")

    # -------------------------------------------------------------
    # 3. Validation Boundaries & Invalid Inputs
    # -------------------------------------------------------------
    print("\n[Group 3/7] Testing Input Validation Boundaries (Pydantic schemas)...")

    # Registration with password < 8 chars
    r = client.post("/api/v1/auth/register", json={"email": "short@findnest.test", "full_name": "Short Pass", "password": "short"})
    assert r.status_code == 422, f"Expected 422 for password < 8, got {r.status_code}"

    # Registration with invalid email format
    r = client.post("/api/v1/auth/register", json={"email": "not-an-email", "full_name": "Invalid Email", "password": "ValidPassword123!"})
    assert r.status_code == 422, f"Expected 422 for invalid email, got {r.status_code}"

    # Item with title empty string
    r = client.post("/api/v1/lost-items", headers=auth_a, json={
        "title": "",
        "category": "other",
        "description": "Valid desc",
        "location": "Valid loc",
        "date_lost": "2026-09-05T12:00:00Z"
    })
    assert r.status_code == 422, f"Expected 422 for empty title, got {r.status_code}"

    # Item with latitude out of range (> 90)
    r = client.post("/api/v1/lost-items", headers=auth_a, json={
        "title": "Invalid Lat Item",
        "category": "other",
        "description": "Valid desc",
        "location": "Valid loc",
        "latitude": 95.5,
        "date_lost": "2026-09-05T12:00:00Z"
    })
    assert r.status_code == 422, f"Expected 422 for latitude > 90, got {r.status_code}"

    # Pagination with limit > 100
    r = client.get("/api/v1/lost-items?limit=150")
    assert r.status_code == 422, f"Expected 422 for limit > 100, got {r.status_code}"

    # Pagination with page < 1
    r = client.get("/api/v1/found-items?page=0")
    assert r.status_code == 422, f"Expected 422 for page < 1, got {r.status_code}"

    print("  [PASS] All validation boundaries (short password, bad email, empty title, invalid lat, page/limit bounds) properly rejected with HTTP 422.")

    # -------------------------------------------------------------
    # 4. Missing Resource (404) Handling
    # -------------------------------------------------------------
    print("\n[Group 4/7] Testing Missing Resource (404 Not Found) Handling...")

    non_existent_id = 999999
    r = client.get(f"/api/v1/lost-items/{non_existent_id}")
    assert r.status_code == 404

    r = client.get(f"/api/v1/found-items/{non_existent_id}")
    assert r.status_code == 404

    r = client.get(f"/api/v1/lost-items/{non_existent_id}/matches")
    assert r.status_code == 404

    r = client.get(f"/api/v1/found-items/{non_existent_id}/matches")
    assert r.status_code == 404

    r = client.put(f"/api/v1/lost-items/{non_existent_id}", headers=auth_a, json={"title": "Updated"})
    assert r.status_code == 404

    r = client.delete(f"/api/v1/lost-items/{non_existent_id}", headers=auth_a)
    assert r.status_code == 404

    r = client.patch(f"/api/v1/notifications/{non_existent_id}/read", headers=auth_a)
    assert r.status_code == 404

    print("  [PASS] All nonexistent lookups, updates, deletions, and match requests return clean HTTP 404.")

    # -------------------------------------------------------------
    # 5. Duplicate Operations Tests
    # -------------------------------------------------------------
    print("\n[Group 5/7] Testing Duplicate Operations Rejection...")

    # Duplicate email registration
    r = client.post("/api/v1/auth/register", json={"email": user_a_email, "full_name": "Duplicate User", "password": password})
    assert r.status_code == 400
    assert "already exists" in r.json()["detail"].lower()
    print("  [PASS] Duplicate user registration rejected with HTTP 400 ('already exists').")

    # -------------------------------------------------------------
    # 6. Image Upload Resiliency Tests
    # -------------------------------------------------------------
    print("\n[Group 6/7] Testing Image Upload Validation & Resiliency...")

    # Corrupted binary claiming to be JPEG
    fake_jpeg = {"file": ("malicious.jpg", io.BytesIO(b"NOT_A_REAL_IMAGE_DATA"), "image/jpeg")}
    r = client.post("/api/v1/upload/image", headers=auth_a, files=fake_jpeg)
    assert r.status_code == 400
    assert "binary signature" in r.json()["detail"].lower()

    # Oversized image (> 5MB)
    large_bytes = JPEG_HEADER + b"0" * (6 * 1024 * 1024)
    large_file = {"file": ("huge_photo.jpg", io.BytesIO(large_bytes), "image/jpeg")}
    r = client.post("/api/v1/upload/image", headers=auth_a, files=large_file)
    assert r.status_code == 400
    assert "5mb" in r.json()["detail"].lower()

    # Disallowed file format (.pdf / .exe)
    pdf_file = {"file": ("document.pdf", io.BytesIO(b"%PDF-1.4..."), "application/pdf")}
    r = client.post("/api/v1/upload/image", headers=auth_a, files=pdf_file)
    assert r.status_code == 400
    assert "unsupported file extension" in r.json()["detail"].lower()

    print("  [PASS] Corrupted images, oversized uploads (>5MB), and disallowed extensions (.pdf) rejected with HTTP 400.")

    # -------------------------------------------------------------
    # 7. Empty State Handling
    # -------------------------------------------------------------
    print("\n[Group 7/7] Testing Empty State Responses...")

    # Empty search query
    r = client.get("/api/v1/lost-items?search=xyz_completely_nonexistent_query_99999")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 0
    assert data["items"] == []
    assert data["pages"] == 1

    # User B with 0 notifications
    r = client.get("/api/v1/notifications/unread-count", headers=auth_b)
    assert r.status_code == 200
    assert r.json()["unread_count"] == 0

    r = client.get("/api/v1/notifications", headers=auth_b)
    assert r.status_code == 200
    assert r.json()["items"] == []
    assert r.json()["total"] == 0

    print("  [PASS] Empty states (nonexistent search, zero notifications) return valid 200 OK structures.")

    print("\n" + "=" * 70)
    print("ALL STEP 11 EDGE-CASE & SECURITY TESTS PASSED PERFECTLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_edge_cases_test()
