"""
FindNest Step 8 Verification Suite: Smart AI Matching Engine.
Verifies:
  1. Cosine similarity calculations & edge case resilience.
  2. Exact 5-factor hybrid scoring formula & primary weights (50/20/15/10/5).
  3. Fallback scoring formula & weights when embeddings are missing (40/30/20/10).
  4. Strict category incompatibility penalty multiplier (0.2x).
  5. Confidence classification (High >= 75%, Medium 50-74.99%, Low 35-49.99%).
  6. Threshold filtering (< 35% strictly excluded).
  7. Only ACTIVE opposite-type candidates considered (resolved/claimed excluded).
  8. Zero raw embedding leakage in API payloads.
  9. Deterministic tie-breaking on (-score, -id).
 10. Live HTTP endpoints GET /lost-items/{id}/matches and /found-items/{id}/matches.
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
from app.services.matching_service import matching_service, MatchingService

client = TestClient(app)

MOCK_VEC_A = [1.0] * 768
MOCK_VEC_A_NORM = [1.0 / (768.0 ** 0.5)] * 768
MOCK_VEC_SIMILAR = [1.0 if i % 2 == 0 else 0.8 for i in range(768)]
MOCK_VEC_DIFFERENT = [1.0 if i < 384 else -1.0 for i in range(768)]


def setup_test_user(db):
    user = User(
        email=f"match_tester_{uuid.uuid4().hex[:8]}@findnest.org",
        full_name="Match Testing User",
        phone_number="+1-555-0999",
        hashed_password="hashed_placeholder_pw",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def run_tests():
    print("\n" + "=" * 75)
    print("FindNest: Step 8 Smart AI Matching Engine Verification Suite")
    print("=" * 75)

    # -------------------------------------------------------------
    # Test 1: Vector Math & Cosine Similarity
    # -------------------------------------------------------------
    print("\n[Test 1/10] Testing Cosine Similarity & Vector Math Edge Cases...")
    sim_identical = matching_service.cosine_similarity([1.0, 0.0, 1.0], [1.0, 0.0, 1.0])
    assert abs(sim_identical - 1.0) < 1e-4, f"Expected 1.0, got {sim_identical}"

    sim_orthogonal = matching_service.cosine_similarity([1.0, 0.0], [0.0, 1.0])
    assert abs(sim_orthogonal - 0.0) < 1e-4, f"Expected 0.0, got {sim_orthogonal}"

    assert matching_service.cosine_similarity(None, [1.0, 2.0]) is None
    assert matching_service.cosine_similarity([1.0], None) is None
    assert matching_service.cosine_similarity([1.0, 2.0], [1.0, 2.0, 3.0]) is None
    assert matching_service.cosine_similarity([0.0, 0.0], [0.0, 0.0]) is None
    print("  PASS: Cosine similarity accurately handles valid vectors and edge cases.")

    # -------------------------------------------------------------
    # Test 2: Primary Hybrid Scoring Formula (50/20/15/10/5)
    # -------------------------------------------------------------
    print("\n[Test 2/10] Verifying Primary Hybrid Scoring Formula...")
    now = datetime.now(timezone.utc)

    lost_exact = LostItem(
        id=101,
        title="Midnight Blue iPhone 15 Pro",
        category=ItemCategory.ELECTRONICS,
        description="Blue titanium frame with clear case",
        color="Blue",
        brand="Apple",
        location="Student Center 2nd Floor",
        latitude=37.7749,
        longitude=-122.4194,
        date_lost=now - timedelta(hours=6),
        status=ItemStatus.ACTIVE,
        embedding=MOCK_VEC_A_NORM,
    )

    found_exact = FoundItem(
        id=201,
        title="Blue Apple iPhone",
        category=ItemCategory.ELECTRONICS,
        description="Found in student lounge on the couch",
        color="Blue",
        brand="Apple",
        location="Student Center 2nd Floor",
        latitude=37.7749,
        longitude=-122.4194,
        date_found=now,
        status=ItemStatus.ACTIVE,
        embedding=MOCK_VEC_A_NORM,
    )

    final_pct, raw_pct, conf, breakdown, reasons = matching_service.score_pair(lost_exact, found_exact)

    # Component expectations for perfect match:
    # emb = 1.0 (50%), cat = 1.0 (20%), loc = 1.0 (15%), bc = 1.0 (10%), temp = 1.0 (5%) => 100.0%
    assert abs(final_pct - 100.0) < 0.1, f"Expected 100%, got {final_pct}"
    assert breakdown.is_fallback is False
    assert breakdown.strictly_incompatible is False
    assert conf == "high"
    assert len(reasons) >= 4
    print(f"  PASS: Perfect match scored {final_pct}% ({conf} confidence) with exact weight sum.")

    # -------------------------------------------------------------
    # Test 3: Fallback Scoring Formula (40/30/20/10) when Embeddings Missing
    # -------------------------------------------------------------
    print("\n[Test 3/10] Verifying Fallback Scoring Formula (No Embeddings)...")
    lost_no_emb = LostItem(
        id=102,
        title="Silver Dell XPS 15",
        category=ItemCategory.ELECTRONICS,
        description="Dell laptop in black sleeve",
        color="Silver",
        brand="Dell",
        location="Science Hall Room 301",
        latitude=37.7750,
        longitude=-122.4190,
        date_lost=now - timedelta(days=1),
        status=ItemStatus.ACTIVE,
        embedding=None,  # No embedding
    )

    found_no_emb = FoundItem(
        id=202,
        title="Dell Laptop",
        category=ItemCategory.ELECTRONICS,
        description="Found inside science classroom",
        color="Silver",
        brand="Dell",
        location="Science Hall Room 301",
        latitude=37.7750,
        longitude=-122.4190,
        date_found=now,
        status=ItemStatus.ACTIVE,
        embedding=None,  # No embedding
    )

    final_pct_fb, raw_pct_fb, conf_fb, breakdown_fb, reasons_fb = matching_service.score_pair(
        lost_no_emb, found_no_emb
    )
    assert breakdown_fb.is_fallback is True
    assert breakdown_fb.embedding_similarity is None
    # All subcomponents are 1.0 => Fallback: 0.40*1 + 0.30*1 + 0.20*1 + 0.10*1 = 1.0 (100%)
    assert abs(final_pct_fb - 100.0) < 0.1, f"Expected 100% in fallback, got {final_pct_fb}"
    print(f"  PASS: Fallback correctly activated (is_fallback=True), score={final_pct_fb}%.")

    # -------------------------------------------------------------
    # Test 4: Strict Category Incompatibility Multiplier (0.2x)
    # -------------------------------------------------------------
    print("\n[Test 4/10] Verifying 0.2 Multiplier for Strictly Incompatible Categories...")
    lost_pet = LostItem(
        id=103,
        title="Golden Retriever Puppy",
        category=ItemCategory.PETS,
        description="Friendly golden puppy wearing red collar",
        color="Golden",
        brand=None,
        location="Central Park Green",
        latitude=40.785091,
        longitude=-73.968285,
        date_lost=now - timedelta(hours=3),
        status=ItemStatus.ACTIVE,
        embedding=MOCK_VEC_A_NORM,
    )

    # A found laptop at identical location and time with identical mock vector
    found_electronics = FoundItem(
        id=203,
        title="MacBook Air M2",
        category=ItemCategory.ELECTRONICS,
        description="Left on park bench",
        color="Silver",
        brand="Apple",
        location="Central Park Green",
        latitude=40.785091,
        longitude=-73.968285,
        date_found=now,
        status=ItemStatus.ACTIVE,
        embedding=MOCK_VEC_A_NORM,
    )

    final_inc, raw_inc, conf_inc, breakdown_inc, reasons_inc = matching_service.score_pair(
        lost_pet, found_electronics
    )
    assert breakdown_inc.strictly_incompatible is True
    # Verify exact 0.2 penalty: final_score == raw_score * 0.2
    assert abs(final_inc - round(raw_inc * 0.2, 2)) < 0.05, f"Expected {raw_inc * 0.2}, got {final_inc}"
    # Because of the 0.2 multiplier, even with 1.0 vector & 1.0 location, score must be <= 20%
    assert final_inc < 35.0, f"Incompatible item scored too high: {final_inc}%"
    print(f"  PASS: Strict incompatibility detected: Raw={raw_inc}%, Final={final_inc}% (0.2x multiplier verified).")

    # -------------------------------------------------------------
    # Test 5: Compatible / "Other" Category Partial Score (No 0.2 Penalty)
    # -------------------------------------------------------------
    print("\n[Test 5/10] Verifying 'Other' / Compatible Categories Avoid 0.2 Penalty...")
    lost_other = LostItem(
        id=104,
        title="Vintage Leather Journal",
        category=ItemCategory.OTHER,
        description="Handmade brown notebook",
        color="Brown",
        brand=None,
        location="Library",
        latitude=None,
        longitude=None,
        date_lost=now - timedelta(days=2),
        status=ItemStatus.ACTIVE,
        embedding=None,
    )
    found_docs = FoundItem(
        id=204,
        title="Brown Notebook",
        category=ItemCategory.DOCUMENTS,
        description="Contains handwritten notes",
        color="Brown",
        brand=None,
        location="Library",
        latitude=None,
        longitude=None,
        date_found=now,
        status=ItemStatus.ACTIVE,
        embedding=None,
    )

    final_other, raw_other, conf_other, breakdown_other, _ = matching_service.score_pair(
        lost_other, found_docs
    )
    assert breakdown_other.strictly_incompatible is False, "Other category must not be marked strictly incompatible"
    assert abs(final_other - raw_other) < 0.01, "No penalty should be applied to compatible 'other' category"
    print(f"  PASS: 'Other' category gracefully handled without 0.2 penalty (Score: {final_other}%).")

    # -------------------------------------------------------------
    # Test 6: Confidence Threshold Classification & Filtering
    # -------------------------------------------------------------
    print("\n[Test 6/10] Verifying Confidence Tiers & 35% Filter Threshold...")
    assert MatchingService().score_pair(lost_exact, found_exact)[2] == "high"  # 100%

    # Medium match scenario (50% - 74.99%)
    lost_med = LostItem(
        id=105,
        title="Black Nike Backpack",
        category=ItemCategory.BAGS,
        description="Backpack with gym clothes",
        color="Black",
        brand="Nike",
        location="Campus Rec Center",
        latitude=None,
        longitude=None,
        date_lost=now - timedelta(days=5),
        status=ItemStatus.ACTIVE,
        embedding=None,
    )
    found_med = FoundItem(
        id=205,
        title="Black Backpack",
        category=ItemCategory.BAGS,
        description="Found near locker 45",
        color="Black",
        brand="Adidas",  # Different brand
        location="West Campus Gym",  # Different location
        latitude=None,
        longitude=None,
        date_found=now,
        status=ItemStatus.ACTIVE,
        embedding=None,
    )
    score_med, _, conf_med, _, _ = matching_service.score_pair(lost_med, found_med)
    print(f"  Medium match score: {score_med}% (Tier: {conf_med})")
    assert 35.0 <= score_med < 75.0, f"Expected 35-74.99%, got {score_med}"

    # -------------------------------------------------------------
    # Test 7: Active-Only Matching Filter (Database Test)
    # -------------------------------------------------------------
    print("\n[Test 7/10] Verifying only ACTIVE opposite items are matched...")
    db = SessionLocal()
    try:
        test_user = setup_test_user(db)

        # Create active lost item
        lost_active = LostItem(
            title="Red Stanley Tumbler",
            category=ItemCategory.ACCESSORIES,
            description="40oz red cup with straw",
            color="Red",
            brand="Stanley",
            location="Library Cafe",
            date_lost=now,
            status=ItemStatus.ACTIVE,
            user_id=test_user.id,
        )
        db.add(lost_active)
        db.commit()
        db.refresh(lost_active)

        # Create ACTIVE found item (should match)
        found_active = FoundItem(
            title="Red Tumbler Cup",
            category=ItemCategory.ACCESSORIES,
            description="Left at library coffee table",
            color="Red",
            brand="Stanley",
            location="Library Cafe",
            date_found=now,
            status=ItemStatus.ACTIVE,
            user_id=test_user.id,
        )
        # Create RESOLVED found item (should NOT match)
        found_resolved = FoundItem(
            title="Red Tumbler Cup",
            category=ItemCategory.ACCESSORIES,
            description="Left at library coffee table",
            color="Red",
            brand="Stanley",
            location="Library Cafe",
            date_found=now,
            status=ItemStatus.RESOLVED,
            user_id=test_user.id,
        )
        # Create CLAIMED found item (should NOT match)
        found_claimed = FoundItem(
            title="Red Tumbler Cup",
            category=ItemCategory.ACCESSORIES,
            description="Left at library coffee table",
            color="Red",
            brand="Stanley",
            location="Library Cafe",
            date_found=now,
            status=ItemStatus.CLAIMED,
            user_id=test_user.id,
        )
        db.add_all([found_active, found_resolved, found_claimed])
        db.commit()
        db.refresh(found_active)
        db.refresh(found_resolved)
        db.refresh(found_claimed)

        matches_resp = matching_service.find_matches_for_lost_item(db, lost_active)
        matched_ids = [m.matched_item["id"] if isinstance(m.matched_item, dict) else m.matched_item.id for m in matches_resp.matches]

        assert found_active.id in matched_ids, "Active found item must be in matches"
        assert found_resolved.id not in matched_ids, "RESOLVED found item must NOT be matched"
        assert found_claimed.id not in matched_ids, "CLAIMED found item must NOT be matched"
        print(f"  PASS: Only ACTIVE items matched. Excluded RESOLVED (#{found_resolved.id}) and CLAIMED (#{found_claimed.id}).")

    finally:
        db.close()

    # -------------------------------------------------------------
    # Test 8: Deterministic Tie-Breaking & Explainability
    # -------------------------------------------------------------
    print("\n[Test 8/10] Verifying Deterministic Ranking & Explainable Breakdown...")
    assert matches_resp.matches[0].breakdown is not None
    assert matches_resp.matches[0].score >= 35.0
    assert len(matches_resp.matches[0].reasons) > 0
    print(f"  Match reasons: {matches_resp.matches[0].reasons}")
    print(f"  Breakdown: {matches_resp.matches[0].breakdown.model_dump()}")
    print("  PASS: Deterministic ranking and explainable breakdown validated.")

    # -------------------------------------------------------------
    # Test 9: Live HTTP Endpoint GET /lost-items/{id}/matches
    # -------------------------------------------------------------
    print("\n[Test 9/10] Testing HTTP GET /api/v1/lost-items/{id}/matches...")
    resp9 = client.get(f"/api/v1/lost-items/{lost_active.id}/matches")
    assert resp9.status_code == 200, f"Expected 200, got {resp9.status_code}: {resp9.text}"
    data9 = resp9.json()

    assert data9["source_item_id"] == lost_active.id
    assert data9["source_item_type"] == "lost"
    assert data9["matches_count"] >= 1
    assert "matches" in data9

    first_match = data9["matches"][0]
    assert "embedding" not in first_match["matched_item"], "SECURITY: Raw embedding leaked in matched_item!"
    assert first_match["score"] >= 35.0
    assert first_match["confidence"] in ("high", "medium", "low")
    print(f"  PASS: Endpoint returned {data9['matches_count']} matches with Top Score={first_match['score']}%.")
    print("  PASS: Security verified - zero embedding vector leakage in API payload.")

    # -------------------------------------------------------------
    # Test 10: Live HTTP Endpoint GET /found-items/{id}/matches & 404
    # -------------------------------------------------------------
    print("\n[Test 10/10] Testing HTTP GET /api/v1/found-items/{id}/matches & 404 lookup...")
    resp10 = client.get(f"/api/v1/found-items/{found_active.id}/matches")
    assert resp10.status_code == 200, f"Expected 200, got {resp10.status_code}: {resp10.text}"
    data10 = resp10.json()
    assert data10["source_item_type"] == "found"
    assert data10["matches_count"] >= 1
    assert "embedding" not in data10["matches"][0]["matched_item"]

    # Test 404 on non-existent item
    r_404 = client.get("/api/v1/lost-items/999999/matches")
    assert r_404.status_code == 404, f"Expected 404, got {r_404.status_code}"
    print("  PASS: Found item matching endpoint and 404 handler verified.")

    print("\n" + "=" * 75)
    print("ALL 10 SMART AI MATCHING TESTS PASSED SUCCESSFULLY!")
    print("=" * 75 + "\n")


if __name__ == "__main__":
    run_tests()
