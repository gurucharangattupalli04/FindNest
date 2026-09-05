"""
FindNest Step 7 Verification Suite: AI Integration & Gemini Embeddings.
Verifies prompt formulation, multimodal image handling, mocked Gemini Embedding 2
vector generation, PostgreSQL vector persistence, API response sanitization
(no vector leak), and non-blocking failure tolerance.
"""
import io
import os
import uuid
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.lost_item import LostItem
from app.models.found_item import FoundItem
from app.services.embedding_service import embedding_service, EmbeddingService

client = TestClient(app)

VALID_JPEG = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00" + b"\x00" * 50
MOCK_768_DIM_VECTOR = [round(float(i % 100) * 0.001, 4) for i in range(768)]


def setup_auth_user():
    email = f"ai_tester_{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPassword123!"

    r = client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "AI Integration Tester",
        "password": password
    })
    assert r.status_code == 201, f"Failed registration: {r.text}"

    l = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert l.status_code == 200, f"Failed login: {l.text}"
    token = l.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, email


def run_tests():
    print("\n" + "=" * 70)
    print("FindNest: Step 7 Gemini AI Embedding Verification Suite")
    print("=" * 70)

    headers, user_email = setup_auth_user()
    print(f"Setup completed: Authenticated user '{user_email}'.\n")

    # -------------------------------------------------------------
    # 1. Text prompt formulation
    # -------------------------------------------------------------
    print("[Test 1/7] Testing structured text prompt formulation...")
    class MockItem:
        title = "Matte Black ThinkPad X1"
        category = "electronics"
        description = "Has an Antigravity IDE sticker on top lid"
        color = "Black"
        brand = "Lenovo"
        location = "Library Quiet Zone, 3rd Floor"

    prompt = embedding_service.build_text_prompt(MockItem())
    assert "Title: Matte Black ThinkPad X1" in prompt
    assert "Category: electronics" in prompt
    assert "Description: Has an Antigravity IDE sticker on top lid" in prompt
    assert "Color: Black" in prompt
    assert "Brand: Lenovo" in prompt
    assert "Location: Library Quiet Zone, 3rd Floor" in prompt
    print("  PASS: All text fields successfully composed into prompt.")

    # -------------------------------------------------------------
    # 2. Multimodal image loading & contents assembly
    # -------------------------------------------------------------
    print("\n[Test 2/7] Testing multimodal image loading and Part assembly...")
    # Create a temporary local image in upload directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    temp_img_path = os.path.join(settings.UPLOAD_DIR, "test_multimodal.jpg")
    with open(temp_img_path, "wb") as f:
        f.write(VALID_JPEG)

    class MockItemWithImage(MockItem):
        image_url = "/static/uploads/test_multimodal.jpg"

    contents, has_image = embedding_service.build_contents(MockItemWithImage())
    assert has_image is True, "Expected has_image to be True"
    assert len(contents) == 2, f"Expected 2 parts (text + image), got {len(contents)}"
    print("  PASS: Local image detected and assembled as Part.")

    # Clean up test file
    try:
        os.remove(temp_img_path)
    except Exception:
        pass

    # -------------------------------------------------------------
    # 3. Non-blocking behavior when GEMINI_API_KEY is not configured
    # -------------------------------------------------------------
    print("\n[Test 3/7] Testing graceful fallback when GEMINI_API_KEY is unconfigured...")
    with patch.object(settings, "GEMINI_API_KEY", ""):
        r3 = client.post("/api/v1/lost-items", headers=headers, json={
            "title": "Blue Water Bottle",
            "category": "accessories",
            "description": "Stainless steel insulated bottle",
            "color": "Blue",
            "brand": "Hydro Flask",
            "location": "Gym Locker Room",
            "date_lost": "2026-09-01T10:00:00Z"
        })
        assert r3.status_code == 201, f"Expected 201, got {r3.status_code}: {r3.text}"
        data3 = r3.json()
        assert "ai_metadata" in data3
        assert data3["ai_metadata"].get("status") == "skipped"
        assert "embedding" not in data3, "API response must not leak raw embedding vector"
        print("  PASS: Item created successfully (HTTP 201) with ai_metadata.status='skipped'.")

    # -------------------------------------------------------------
    # 4. Mocked Gemini Embedding Generation on Lost Item (Create)
    # -------------------------------------------------------------
    print("\n[Test 4/7] Testing Gemini 768-dim embedding generation on Lost Item...")
    with patch.object(settings, "GEMINI_API_KEY", "mock-valid-gemini-key-xyz"):
        with patch.object(EmbeddingService, "generate_raw_embedding", return_value=MOCK_768_DIM_VECTOR):
            r4 = client.post("/api/v1/lost-items", headers=headers, json={
                "title": "Silver MacBook Air M2",
                "category": "electronics",
                "description": "Silver 13-inch MacBook Air with leather sleeve",
                "color": "Silver",
                "brand": "Apple",
                "location": "Student Union Cafe",
                "date_lost": "2026-09-02T14:30:00Z"
            })
            assert r4.status_code == 201, f"Expected 201, got {r4.status_code}: {r4.text}"
            data4 = r4.json()
            lost_id = data4["id"]

            # Verify API response
            assert "embedding" not in data4, "Security check: raw embedding must NOT be exposed in API response"
            meta = data4.get("ai_metadata", {})
            assert meta.get("model") == "gemini-embedding-2", f"Unexpected model: {meta}"
            assert meta.get("dimensions") == 768, f"Unexpected dimensions: {meta}"
            assert meta.get("status") == "completed"
            assert meta.get("has_text") is True

            # Verify direct PostgreSQL persistence
            db = SessionLocal()
            try:
                db_item = db.query(LostItem).filter(LostItem.id == lost_id).first()
                assert db_item is not None
                assert db_item.embedding is not None, "PostgreSQL embedding column must not be None"
                assert len(db_item.embedding) == 768, f"Expected 768 dimensions, got {len(db_item.embedding)}"
                assert abs(db_item.embedding[0] - MOCK_768_DIM_VECTOR[0]) < 1e-4
                print("  PASS: Stored 768-dim float vector in PostgreSQL double precision[] column.")
                print("  PASS: API response cleanly returned ai_metadata and excluded raw vector.")
            finally:
                db.close()

    # -------------------------------------------------------------
    # 5. Mocked Gemini Embedding Generation on Found Item (Create)
    # -------------------------------------------------------------
    print("\n[Test 5/7] Testing Gemini embedding generation on Found Item...")
    with patch.object(settings, "GEMINI_API_KEY", "mock-valid-gemini-key-xyz"):
        with patch.object(EmbeddingService, "generate_raw_embedding", return_value=MOCK_768_DIM_VECTOR):
            r5 = client.post("/api/v1/found-items", headers=headers, json={
                "title": "Brown Leather Wallet",
                "category": "wallets",
                "description": "Found on the bench outside dining hall",
                "color": "Brown",
                "brand": "Fossil",
                "location": "Dining Hall Courtyard",
                "storage_location": "Security Office Box B-4",
                "date_found": "2026-09-03T11:00:00Z"
            })
            assert r5.status_code == 201, f"Expected 201, got {r5.status_code}: {r5.text}"
            data5 = r5.json()
            found_id = data5["id"]

            assert "embedding" not in data5, "FoundItem API response must NOT leak raw embedding"
            assert data5["ai_metadata"].get("model") == "gemini-embedding-2"
            assert data5["ai_metadata"].get("dimensions") == 768

            db = SessionLocal()
            try:
                db_found = db.query(FoundItem).filter(FoundItem.id == found_id).first()
                assert db_found is not None
                assert db_found.embedding is not None
                assert len(db_found.embedding) == 768
                print("  PASS: Found item embedding generated and persisted in PostgreSQL.")
            finally:
                db.close()

    # -------------------------------------------------------------
    # 6. Embedding regeneration on Item Update
    # -------------------------------------------------------------
    print("\n[Test 6/7] Testing embedding regeneration on Item Update...")
    NEW_VECTOR = [0.5] * 768
    with patch.object(settings, "GEMINI_API_KEY", "mock-valid-gemini-key-xyz"):
        with patch.object(EmbeddingService, "generate_raw_embedding", return_value=NEW_VECTOR):
            r6 = client.put(f"/api/v1/found-items/{found_id}", headers=headers, json={
                "description": "Updated: Found on bench, now moved to Room 102",
                "storage_location": "Main Security Desk"
            })
            assert r6.status_code == 200, f"Expected 200, got {r6.status_code}: {r6.text}"

            db = SessionLocal()
            try:
                updated_item = db.query(FoundItem).filter(FoundItem.id == found_id).first()
                assert updated_item.embedding is not None
                assert abs(updated_item.embedding[0] - 0.5) < 1e-4
                print("  PASS: Embedding vector successfully updated upon item update.")
            finally:
                db.close()

    # -------------------------------------------------------------
    # 7. Non-blocking error handling when Gemini API fails
    # -------------------------------------------------------------
    print("\n[Test 7/7] Verifying API failure tolerance (item creation never fails)...")
    with patch.object(settings, "GEMINI_API_KEY", "mock-valid-gemini-key-xyz"):
        with patch.object(EmbeddingService, "generate_raw_embedding", side_effect=RuntimeError("Google Gemini API quota exceeded (HTTP 429)")):
            r7 = client.post("/api/v1/lost-items", headers=headers, json={
                "title": "Black Noise Cancelling Headphones",
                "category": "electronics",
                "description": "Sony WH-1000XM4 in black hard case",
                "color": "Black",
                "brand": "Sony",
                "location": "Auditorium Hall B",
                "date_lost": "2026-09-04T18:00:00Z"
            })
            assert r7.status_code == 201, f"Expected 201 even on AI failure, got {r7.status_code}: {r7.text}"
            data7 = r7.json()
            assert "ai_metadata" in data7
            assert data7["ai_metadata"].get("status") == "failed"
            assert "Google Gemini API quota exceeded" in data7["ai_metadata"].get("error", "")
            print("  PASS: Item created safely with HTTP 201 and failure recorded in ai_metadata without throwing 500.")

    print("\n" + "=" * 70)
    print("ALL 7 AI EMBEDDING INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    run_tests()
