"""
FindNest Step 6 Verification Suite: Image Upload & Storage.
Tests authentication, file type validation, magic bytes, size limits,
successful upload flow, and PostgreSQL image_url persistence.
"""
import io
import uuid
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.models.lost_item import LostItem
from app.models.found_item import FoundItem

client = TestClient(app)

# Minimal valid magic bytes fixtures
VALID_JPEG = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00" + b"\x00" * 50
VALID_PNG = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00"
VALID_WEBP = b"RIFF\x24\x00\x00\x00WEBPVP8 \x18\x00\x00\x00\x30\x01\x00\x9d\x01\x2a\x01\x00\x01\x00\x02\x00\x34\x25\xa4\x00\x03\x70\x00\xfe\xfb\xfd\xb5\x00"


def setup_auth_user():
    email = f"upload_user_{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPassword123!"

    # Register
    r = client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "Upload Tester",
        "password": password
    })
    assert r.status_code == 201, f"Failed registration: {r.text}"

    # Login
    l = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert l.status_code == 200, f"Failed login: {l.text}"
    token = l.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, email


def run_tests():
    print("\n" + "=" * 65)
    print("FindNest: Step 6 Image Upload & Storage Verification Suite")
    print("=" * 65)

    headers, user_email = setup_auth_user()
    print(f"Setup completed: Authenticated user '{user_email}'.\n")

    # -------------------------------------------------------------
    # 1. Unauthenticated upload returns HTTP 401
    # -------------------------------------------------------------
    print("[Test 1/6] Verifying unauthenticated image upload is rejected...")
    files = {"file": ("test.jpg", io.BytesIO(VALID_JPEG), "image/jpeg")}
    r1 = client.post("/api/v1/upload/image", files=files)
    assert r1.status_code == 401, f"Expected 401, got {r1.status_code}: {r1.text}"
    print("  PASS: Unauthenticated upload rejected with HTTP 401.")

    # -------------------------------------------------------------
    # 2. Invalid file extension or MIME type returns HTTP 400
    # -------------------------------------------------------------
    print("\n[Test 2/6] Verifying invalid file types (.txt, .pdf) are rejected...")
    # Disallowed extension
    files_txt = {"file": ("document.txt", io.BytesIO(b"Hello text file"), "text/plain")}
    r2_txt = client.post("/api/v1/upload/image", headers=headers, files=files_txt)
    assert r2_txt.status_code == 400, f"Expected 400 for .txt, got {r2_txt.status_code}"

    # Disallowed MIME type
    files_pdf = {"file": ("document.pdf", io.BytesIO(b"%PDF-1.4 sample"), "application/pdf")}
    r2_pdf = client.post("/api/v1/upload/image", headers=headers, files=files_pdf)
    assert r2_pdf.status_code == 400, f"Expected 400 for .pdf, got {r2_pdf.status_code}"
    print(f"  Rejected text/plain: '{r2_txt.json()['detail']}'")
    print("  PASS: Disallowed extensions and MIME types properly rejected with HTTP 400.")

    # -------------------------------------------------------------
    # 3. Disguised invalid magic bytes return HTTP 400
    # -------------------------------------------------------------
    print("\n[Test 3/6] Verifying file claiming to be JPEG with invalid binary content is rejected...")
    fake_jpeg = {"file": ("malicious.jpg", io.BytesIO(b"NOT_A_REAL_IMAGE_DATA"), "image/jpeg")}
    r3 = client.post("/api/v1/upload/image", headers=headers, files=fake_jpeg)
    assert r3.status_code == 400, f"Expected 400 for fake magic bytes, got {r3.status_code}"
    print(f"  Rejected corrupted binary: '{r3.json()['detail']}'")
    print("  PASS: Binary magic byte validation prevents invalid/corrupt image uploads.")

    # -------------------------------------------------------------
    # 4. Exceeding file size limit (>5MB) returns HTTP 400
    # -------------------------------------------------------------
    print("\n[Test 4/6] Verifying file exceeding 5MB limit is rejected...")
    large_bytes = VALID_JPEG + b"0" * (6 * 1024 * 1024)  # ~6MB
    large_file = {"file": ("huge_photo.jpg", io.BytesIO(large_bytes), "image/jpeg")}
    r4 = client.post("/api/v1/upload/image", headers=headers, files=large_file)
    assert r4.status_code == 400, f"Expected 400 for oversized file, got {r4.status_code}: {r4.text}"
    print(f"  Rejected oversized upload: '{r4.json()['detail']}'")
    print("  PASS: 5MB size limit enforced.")

    # -------------------------------------------------------------
    # 5. Valid uploads for JPEG, PNG, and WebP succeed
    # -------------------------------------------------------------
    print("\n[Test 5/6] Verifying valid uploads for JPEG, PNG, and WebP...")
    # Valid JPEG
    r5_jpg = client.post("/api/v1/upload/image", headers=headers, files={"file": ("photo.jpg", io.BytesIO(VALID_JPEG), "image/jpeg")})
    assert r5_jpg.status_code == 200, f"Failed JPEG upload: {r5_jpg.text}"
    data_jpg = r5_jpg.json()
    assert "image_url" in data_jpg
    assert data_jpg["content_type"] == "image/jpeg"
    print(f"  Uploaded JPEG successfully -> URL: {data_jpg['image_url']}")

    # Valid PNG
    r5_png = client.post("/api/v1/upload/image", headers=headers, files={"file": ("graphic.png", io.BytesIO(VALID_PNG), "image/png")})
    assert r5_png.status_code == 200, f"Failed PNG upload: {r5_png.text}"
    data_png = r5_png.json()
    print(f"  Uploaded PNG successfully  -> URL: {data_png['image_url']}")

    # Valid WebP
    r5_webp = client.post("/api/v1/upload/image", headers=headers, files={"file": ("banner.webp", io.BytesIO(VALID_WEBP), "image/webp")})
    assert r5_webp.status_code == 200, f"Failed WebP upload: {r5_webp.text}"
    data_webp = r5_webp.json()
    print(f"  Uploaded WebP successfully -> URL: {data_webp['image_url']}")
    print("  PASS: Supported image formats uploaded and assigned valid URLs.")

    # -------------------------------------------------------------
    # 6. End-to-end PostgreSQL verification: image_url saved in database
    # -------------------------------------------------------------
    print("\n[Test 6/6] Verifying uploaded image URL is correctly persisted in PostgreSQL...")
    uploaded_url = data_jpg["image_url"]

    # 6A: Create Lost Item with uploaded image URL
    lost_payload = {
        "title": "Black Bose Noise-Cancelling Headphones",
        "category": "electronics",
        "description": "Left in conference hall B on the front table.",
        "location": "Science Building Conference Hall B",
        "date_lost": "2026-09-05T12:00:00Z",
        "reward": "$40 Reward",
        "image_url": uploaded_url,
        "contact_name": "Audio Engineer"
    }
    r_lost = client.post("/api/v1/lost-items", headers=headers, json=lost_payload)
    assert r_lost.status_code == 201, f"Failed lost item create: {r_lost.text}"
    lost_item_id = r_lost.json()["id"]
    assert r_lost.json()["image_url"] == uploaded_url

    # 6B: Create Found Item with uploaded image URL
    found_payload = {
        "title": "Brown Leather Cardholder Wallet",
        "category": "wallets",
        "description": "Contains student ID card and bus pass.",
        "location": "Campus Bookstore Register 2",
        "storage_location": "Bookstore Customer Service Desk",
        "date_found": "2026-09-05T13:00:00Z",
        "image_url": uploaded_url,
        "contact_name": "Bookstore Associate"
    }
    r_found = client.post("/api/v1/found-items", headers=headers, json=found_payload)
    assert r_found.status_code == 201, f"Failed found item create: {r_found.text}"
    found_item_id = r_found.json()["id"]
    assert r_found.json()["image_url"] == uploaded_url

    # 6C: Direct PostgreSQL session verification
    db = SessionLocal()
    try:
        db_lost = db.query(LostItem).filter(LostItem.id == lost_item_id).first()
        assert db_lost is not None
        assert db_lost.image_url == uploaded_url, f"Expected {uploaded_url}, found {db_lost.image_url}"
        print(f"  PostgreSQL DB Record (LostItem #{db_lost.id}):")
        print(f"    Title:     '{db_lost.title}'")
        print(f"    Image URL: '{db_lost.image_url}'")

        db_found = db.query(FoundItem).filter(FoundItem.id == found_item_id).first()
        assert db_found is not None
        assert db_found.image_url == uploaded_url, f"Expected {uploaded_url}, found {db_found.image_url}"
        print(f"  PostgreSQL DB Record (FoundItem #{db_found.id}):")
        print(f"    Title:     '{db_found.title}'")
        print(f"    Image URL: '{db_found.image_url}'")
    finally:
        db.close()

    # 6D: Read item back via GET /lost-items/{id}
    r_get = client.get(f"/api/v1/lost-items/{lost_item_id}")
    assert r_get.status_code == 200
    assert r_get.json()["image_url"] == uploaded_url

    print("  PASS: image_url correctly stored in PostgreSQL and retrieved via API.")

    print("\n" + "=" * 65)
    print("ALL 6 IMAGE UPLOAD & STORAGE TESTS PASSED PERFECTLY!")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    run_tests()
