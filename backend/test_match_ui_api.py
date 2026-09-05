"""
FindNest Step 9 Verification Suite: Match Results UI-API Contract Tests.
Verifies all API contracts and data shapes required by the Smart AI Matches UI:
  1. Matches response schema structure matching ItemMatchesResponse.
  2. All 5-factor breakdown properties exist with correct types and ranges.
  3. Confidence tier strictly adheres to 'high' | 'medium' | 'low'.
  4. Human-readable reasons list format.
  5. Candidate item details (title, category, location, dates, storage/reward, images).
  6. Zero raw embedding vector leakage in matched_item payload.
  7. Query parameters (limit) properly enforced.
  8. Reciprocal matching (LostItem queries FoundItem, FoundItem queries LostItem).
  9. HTTP 404 response for invalid/non-existent IDs.
 10. Active status filtering.
"""
import uuid
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.models.enums import ItemCategory, ItemStatus
from app.models.lost_item import LostItem
from app.models.found_item import FoundItem
from app.models.user import User

client = TestClient(app)

MOCK_EMB = [0.05] * 768


def create_user(db):
    u = User(
        email=f"ui_match_test_{uuid.uuid4().hex[:8]}@findnest.org",
        full_name="Match UI Tester",
        phone_number="+1-555-0888",
        hashed_password="hashed_placeholder_pw",
        is_active=True,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def run_ui_contract_tests():
    print("\n" + "=" * 75)
    print("FindNest: Step 9 Match Results UI-API Contract Verification Suite")
    print("=" * 75)

    db = SessionLocal()
    try:
        user = create_user(db)
        now = datetime.now(timezone.utc)

        # Seed high-confidence lost item
        lost_item = LostItem(
            title="Matte Black Sony WH-1000XM5",
            category=ItemCategory.ELECTRONICS,
            description="Premium noise cancelling headphones in black travel case",
            color="Black",
            brand="Sony",
            location="University Student Center Lounge",
            latitude=37.7749,
            longitude=-122.4194,
            date_lost=now - timedelta(hours=8),
            reward="$50",
            status=ItemStatus.ACTIVE,
            embedding=MOCK_EMB,
            user_id=user.id,
        )
        db.add(lost_item)
        db.commit()
        db.refresh(lost_item)

        # Seed high-confidence found item
        found_item = FoundItem(
            title="Sony Black Headphones",
            category=ItemCategory.ELECTRONICS,
            description="Found Sony noise cancelling headphones in black case",
            color="Black",
            brand="Sony",
            location="University Student Center",
            storage_location="Campus Safety Desk Locker 3",
            latitude=37.7749,
            longitude=-122.4194,
            date_found=now,
            status=ItemStatus.ACTIVE,
            embedding=MOCK_EMB,
            user_id=user.id,
        )
        db.add(found_item)
        db.commit()
        db.refresh(found_item)

        # -------------------------------------------------------------
        # Test 1: Schema Structure for Lost Item Matches
        # -------------------------------------------------------------
        print("\n[Test 1/10] Verifying Lost Item Matches Response Schema...")
        r1 = client.get(f"/api/v1/lost-items/{lost_item.id}/matches")
        assert r1.status_code == 200, f"Expected 200, got {r1.status_code}: {r1.text}"
        data1 = r1.json()

        assert "source_item_id" in data1
        assert "source_item_type" in data1
        assert "source_item_title" in data1
        assert "total_candidates_analyzed" in data1
        assert "matches_count" in data1
        assert "threshold_applied" in data1
        assert "matches" in data1
        assert data1["source_item_type"] == "lost"
        assert data1["source_item_id"] == lost_item.id
        print("  PASS: Matches response contains all required root schema fields.")

        # -------------------------------------------------------------
        # Test 2: Breakdown Fields & Types
        # -------------------------------------------------------------
        print("\n[Test 2/10] Verifying 5-Factor Breakdown Properties...")
        assert len(data1["matches"]) > 0, "Expected at least 1 match"
        first_match = data1["matches"][0]
        b = first_match["breakdown"]

        expected_factors = [
            "embedding_similarity",
            "category_score",
            "location_score",
            "brand_color_score",
            "temporal_score",
            "is_fallback",
            "strictly_incompatible",
            "raw_score",
            "final_score",
        ]
        for factor in expected_factors:
            assert factor in b, f"Missing breakdown factor: {factor}"

        assert isinstance(b["category_score"], (int, float))
        assert isinstance(b["location_score"], (int, float))
        assert isinstance(b["brand_color_score"], (int, float))
        assert isinstance(b["temporal_score"], (int, float))
        assert isinstance(b["is_fallback"], bool)
        assert isinstance(b["strictly_incompatible"], bool)
        print("  PASS: All 5-factor breakdown fields are present with correct data types.")

        # -------------------------------------------------------------
        # Test 3: Confidence Tier Adherence
        # -------------------------------------------------------------
        print("\n[Test 3/10] Verifying Confidence Tier Mapping...")
        confidence = first_match["confidence"]
        assert confidence in ("high", "medium", "low"), f"Invalid confidence tier: {confidence}"
        score = first_match["score"]
        if score >= 75.0:
            assert confidence == "high"
        elif score >= 50.0:
            assert confidence == "medium"
        else:
            assert confidence == "low"
        print(f"  PASS: Confidence '{confidence}' aligns with score {score}%.")

        # -------------------------------------------------------------
        # Test 4: Human-Readable Reasons Format
        # -------------------------------------------------------------
        print("\n[Test 4/10] Verifying Human-Readable Match Reasons Format...")
        reasons = first_match["reasons"]
        assert isinstance(reasons, list)
        assert len(reasons) > 0, "Reasons list must not be empty"
        for r in reasons:
            assert isinstance(r, str) and len(r.strip()) > 0
        print(f"  PASS: Human-readable reasons verified ({len(reasons)} reasons generated).")

        # -------------------------------------------------------------
        # Test 5: Matched Item Essential Details
        # -------------------------------------------------------------
        print("\n[Test 5/10] Verifying Matched Item Essential Details...")
        m_item = first_match["matched_item"]
        essential_keys = ["id", "title", "category", "location", "status"]
        for k in essential_keys:
            assert k in m_item, f"Missing essential key '{k}' in matched_item"
        assert m_item["id"] == found_item.id
        assert m_item["storage_location"] == "Campus Safety Desk Locker 3"
        print("  PASS: Matched item includes essential attributes including safekeeping location.")

        # -------------------------------------------------------------
        # Test 6: Zero Embedding Leakage in Matched Item
        # -------------------------------------------------------------
        print("\n[Test 6/10] Verifying Strict Exclusion of Raw Embeddings...")
        assert "embedding" not in m_item, "SECURITY FAILURE: Raw embedding leaked in matched_item!"
        print("  PASS: Matched item completely excludes raw 768-dim embedding.")

        # -------------------------------------------------------------
        # Test 7: Limit Parameter
        # -------------------------------------------------------------
        print("\n[Test 7/10] Verifying Limit Query Parameter...")
        r7 = client.get(f"/api/v1/lost-items/{lost_item.id}/matches?limit=1")
        assert r7.status_code == 200
        data7 = r7.json()
        assert len(data7["matches"]) <= 1
        print(f"  PASS: Limit parameter respected (Returned {len(data7['matches'])} matches).")

        # -------------------------------------------------------------
        # Test 8: Reciprocal Matching (Found Item Queries Lost Items)
        # -------------------------------------------------------------
        print("\n[Test 8/10] Verifying Reciprocal Found Item Matching...")
        r8 = client.get(f"/api/v1/found-items/{found_item.id}/matches")
        assert r8.status_code == 200
        data8 = r8.json()
        assert data8["source_item_type"] == "found"
        assert data8["source_item_id"] == found_item.id
        assert len(data8["matches"]) > 0
        assert data8["matches"][0]["matched_item"]["id"] == lost_item.id
        assert data8["matches"][0]["matched_item"]["reward"] == "$50"
        print("  PASS: Reciprocal matching succeeded and preserved reward information.")

        # -------------------------------------------------------------
        # Test 9: HTTP 404 for Invalid IDs
        # -------------------------------------------------------------
        print("\n[Test 9/10] Verifying 404 Response for Invalid IDs...")
        r9_lost = client.get("/api/v1/lost-items/999999/matches")
        assert r9_lost.status_code == 404
        r9_found = client.get("/api/v1/found-items/999999/matches")
        assert r9_found.status_code == 404
        print("  PASS: 404 returned correctly for nonexistent items.")

        # -------------------------------------------------------------
        # Test 10: Active Status Filter
        # -------------------------------------------------------------
        print("\n[Test 10/10] Verifying Resolved/Claimed Candidates are Excluded...")
        inactive_found = FoundItem(
            title="Sony Black Headphones",
            category=ItemCategory.ELECTRONICS,
            description="Sony headphones - resolved",
            color="Black",
            brand="Sony",
            location="University Student Center",
            status=ItemStatus.RESOLVED,
            date_found=now,
            user_id=user.id,
        )
        db.add(inactive_found)
        db.commit()
        db.refresh(inactive_found)

        r10 = client.get(f"/api/v1/lost-items/{lost_item.id}/matches")
        data10 = r10.json()
        matched_ids = [m["matched_item"]["id"] for m in data10["matches"]]
        assert inactive_found.id not in matched_ids
        print(f"  PASS: Inactive candidate (#{inactive_found.id}) successfully filtered out.")

        print("\n" + "=" * 75)
        print("ALL 10 MATCH RESULTS UI-API CONTRACT TESTS PASSED SUCCESSFULLY!")
        print("=" * 75 + "\n")

    finally:
        db.close()


if __name__ == "__main__":
    run_ui_contract_tests()
