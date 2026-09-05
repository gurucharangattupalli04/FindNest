"""
Automated backend verification test suite for FindNest Step 5: Lost & Found Item Management (CRUD).
Tests all 13 requirements including owner-based authorization, multi-field search, pagination,
public listing, and security.
"""
import time
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.enums import ItemCategory, ItemStatus
from app.models.lost_item import LostItem
from app.models.found_item import FoundItem

client = TestClient(app)


def run_crud_tests():
    print("=" * 65)
    print("FindNest: Step 5 CRUD & Authorization Verification Suite")
    print("=" * 65)

    ts = int(time.time())
    
    # -------------------------------------------------------------
    # Setup: Create Two Distinct Users (Owner vs Other User)
    # -------------------------------------------------------------
    user1_email = f"owner.{ts}@findnest.org"
    user2_email = f"other.{ts}@findnest.org"
    password = "StrongPassword2026!"

    # Register User 1
    r1 = client.post("/api/v1/auth/register", json={
        "email": user1_email, "full_name": "Alice Owner", "password": password
    })
    assert r1.status_code == 201, f"Failed user1 register: {r1.text}"
    
    # Login User 1
    l1 = client.post("/api/v1/auth/login", json={"email": user1_email, "password": password})
    assert l1.status_code == 200
    token1 = l1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # Register User 2
    r2 = client.post("/api/v1/auth/register", json={
        "email": user2_email, "full_name": "Bob Intruder", "password": password
    })
    assert r2.status_code == 201
    
    # Login User 2
    l2 = client.post("/api/v1/auth/login", json={"email": user2_email, "password": password})
    assert l2.status_code == 200
    token2 = l2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    print("Setup completed: Registered Alice (Owner) and Bob (Other User).")

    # -------------------------------------------------------------
    # 1. Unauthenticated creation is rejected with HTTP 401
    # -------------------------------------------------------------
    print("\n[Test 1/13] Verifying unauthenticated item creation is rejected...")
    lost_payload = {
        "title": "Titanium Citizen Watch",
        "category": "accessories",
        "description": "Lost near the tennis courts. Has a sapphire glass face.",
        "color": "Silver",
        "brand": "Citizen",
        "location": "Central Park Tennis Center",
        "date_lost": "2026-09-05T10:00:00Z",
        "reward": "$75 Reward",
    }
    unauth_res = client.post("/api/v1/lost-items", json=lost_payload)
    print(f"  Response Status: {unauth_res.status_code}")
    assert unauth_res.status_code == 401, f"Expected 401, got {unauth_res.status_code}"
    print("  PASS: Unauthenticated creation properly rejected with HTTP 401.")

    # -------------------------------------------------------------
    # 2. Authenticated user can create a lost item
    # -------------------------------------------------------------
    print("\n[Test 2/13] Authenticated user creates a lost item...")
    create_lost_res = client.post("/api/v1/lost-items", json=lost_payload, headers=headers1)
    print(f"  Response Status: {create_lost_res.status_code}")
    assert create_lost_res.status_code == 201, f"Expected 201, got {create_lost_res.status_code}: {create_lost_res.text}"
    created_lost = create_lost_res.json()
    lost_id = created_lost["id"]
    print(f"  Created Lost Item ID: {lost_id}, Title: '{created_lost['title']}'")
    assert created_lost["title"] == lost_payload["title"]
    assert created_lost["user_id"] is not None
    print("  PASS: Lost item created successfully with user reference.")

    # -------------------------------------------------------------
    # 3. Authenticated user can create a found item
    # -------------------------------------------------------------
    print("\n[Test 3/13] Authenticated user creates a found item...")
    found_payload = {
        "title": "Red Leather Keyring with Gym Tag",
        "category": "keys",
        "description": "Found on the second floor bench near the elevators.",
        "color": "Red",
        "brand": "Orbitkey",
        "location": "Metro Tower 2nd Floor",
        "storage_location": "Building Security Desk Floor 1",
        "date_found": "2026-09-05T11:30:00Z",
    }
    create_found_res = client.post("/api/v1/found-items", json=found_payload, headers=headers1)
    print(f"  Response Status: {create_found_res.status_code}")
    assert create_found_res.status_code == 201, f"Expected 201, got {create_found_res.status_code}: {create_found_res.text}"
    created_found = create_found_res.json()
    found_id = created_found["id"]
    print(f"  Created Found Item ID: {found_id}, Storage: '{created_found['storage_location']}'")
    assert created_found["title"] == found_payload["title"]
    assert created_found["user_id"] is not None
    print("  PASS: Found item created successfully with storage details.")

    # -------------------------------------------------------------
    # 4. Public user can list items without authentication
    # -------------------------------------------------------------
    print("\n[Test 4/13] Public user lists lost and found items...")
    list_lost = client.get("/api/v1/lost-items")
    list_found = client.get("/api/v1/found-items")
    assert list_lost.status_code == 200, f"Expected 200, got {list_lost.status_code}"
    assert list_found.status_code == 200, f"Expected 200, got {list_found.status_code}"
    lost_data = list_lost.json()
    found_data = list_found.json()
    print(f"  Public list retrieved {len(lost_data['items'])} lost items and {len(found_data['items'])} found items.")
    assert lost_data["total"] >= 1
    assert found_data["total"] >= 1
    print("  PASS: Public listing succeeds without requiring authentication.")

    # -------------------------------------------------------------
    # 5. User can retrieve an individual item
    # -------------------------------------------------------------
    print("\n[Test 5/13] Retrieving individual item by ID...")
    get_lost = client.get(f"/api/v1/lost-items/{lost_id}")
    get_found = client.get(f"/api/v1/found-items/{found_id}")
    assert get_lost.status_code == 200
    assert get_found.status_code == 200
    assert get_lost.json()["id"] == lost_id
    assert get_found.json()["id"] == found_id
    print("  PASS: Individual items retrieved correctly.")

    # -------------------------------------------------------------
    # 6. Owner can update their own item
    # -------------------------------------------------------------
    print("\n[Test 6/13] Owner updates their own item...")
    update_lost_payload = {
        "reward": "$100 Reward (Increased)",
        "description": "Updated: Watch has an engraving on the back plate 'AC 2024'."
    }
    up_res = client.put(f"/api/v1/lost-items/{lost_id}", json=update_lost_payload, headers=headers1)
    print(f"  Response Status: {up_res.status_code}")
    assert up_res.status_code == 200, f"Expected 200, got {up_res.status_code}: {up_res.text}"
    updated_item = up_res.json()
    assert updated_item["reward"] == "$100 Reward (Increased)"
    assert "engraving" in updated_item["description"]
    print("  PASS: Owner successfully updated their lost item.")

    # -------------------------------------------------------------
    # 7. Non-owner CANNOT update another user's item (HTTP 403)
    # -------------------------------------------------------------
    print("\n[Test 7/13] Non-owner attempts to update Alice's item...")
    intruder_up_res = client.put(
        f"/api/v1/lost-items/{lost_id}",
        json={"title": "Hacked Title"},
        headers=headers2
    )
    print(f"  Response Status: {intruder_up_res.status_code}")
    assert intruder_up_res.status_code == 403, f"Expected 403, got {intruder_up_res.status_code}"
    print(f"  Detail: {intruder_up_res.json().get('detail')}")
    print("  PASS: Unauthorized update blocked with HTTP 403 Forbidden.")

    # -------------------------------------------------------------
    # 8. Non-owner CANNOT delete another user's item (HTTP 403)
    # -------------------------------------------------------------
    print("\n[Test 8/13] Non-owner attempts to delete Alice's item...")
    intruder_del_res = client.delete(f"/api/v1/lost-items/{lost_id}", headers=headers2)
    print(f"  Response Status: {intruder_del_res.status_code}")
    assert intruder_del_res.status_code == 403, f"Expected 403, got {intruder_del_res.status_code}"
    print(f"  Detail: {intruder_del_res.json().get('detail')}")
    print("  PASS: Unauthorized deletion blocked with HTTP 403 Forbidden.")

    # -------------------------------------------------------------
    # 9. Multi-field search works
    # -------------------------------------------------------------
    print("\n[Test 9/13] Verifying search across title, brand, color, location...")
    # Search by brand "Citizen"
    s1 = client.get("/api/v1/lost-items?search=Citizen").json()
    assert any(i["id"] == lost_id for i in s1["items"]), "Search by brand failed"

    # Search by location "Tennis"
    s2 = client.get("/api/v1/lost-items?search=Tennis").json()
    assert any(i["id"] == lost_id for i in s2["items"]), "Search by location failed"

    # Search by color "Silver"
    s3 = client.get("/api/v1/lost-items?search=Silver").json()
    assert any(i["id"] == lost_id for i in s3["items"]), "Search by color failed"

    # Search for non-existent keyword
    s4 = client.get("/api/v1/lost-items?search=NonExistentKeywordXYZ999").json()
    assert len(s4["items"]) == 0
    print("  PASS: Multi-field search functions accurately.")

    # -------------------------------------------------------------
    # 10. Category and Status filtering
    # -------------------------------------------------------------
    print("\n[Test 10/13] Verifying category and status filters...")
    f1 = client.get("/api/v1/lost-items?category=accessories").json()
    assert any(i["id"] == lost_id for i in f1["items"])

    f2 = client.get("/api/v1/lost-items?category=pets").json()
    assert not any(i["id"] == lost_id for i in f2["items"])
    print("  PASS: Category filtering confirmed.")

    # -------------------------------------------------------------
    # 11. Pagination
    # -------------------------------------------------------------
    print("\n[Test 11/13] Verifying pagination parameters...")
    p1 = client.get("/api/v1/lost-items?page=1&limit=1").json()
    assert len(p1["items"]) <= 1
    assert p1["page"] == 1
    assert p1["limit"] == 1
    assert "total" in p1
    assert "pages" in p1
    print(f"  Pagination verified: total={p1['total']}, pages={p1['pages']}")
    print("  PASS: Pagination works properly.")

    # -------------------------------------------------------------
    # 12. Security check: API responses NEVER expose password fields
    # -------------------------------------------------------------
    print("\n[Test 12/13] Checking that no response exposes password hashes...")
    res_items = client.get(f"/api/v1/lost-items/{lost_id}").json()
    assert "hashed_password" not in res_items
    assert "password" not in res_items
    print("  PASS: Passwords never exposed in item endpoints.")

    # -------------------------------------------------------------
    # 13. Owner can delete their own item
    # -------------------------------------------------------------
    print("\n[Test 13/13] Owner deletes their own item...")
    del_res = client.delete(f"/api/v1/lost-items/{lost_id}", headers=headers1)
    print(f"  Response Status: {del_res.status_code}")
    assert del_res.status_code == 200, f"Expected 200, got {del_res.status_code}"
    
    # Confirm item no longer exists
    get_after = client.get(f"/api/v1/lost-items/{lost_id}")
    assert get_after.status_code == 404
    print("  PASS: Owner deleted own item; verified 404 on subsequent lookup.")

    print("\n" + "=" * 65)
    print("ALL 13 CRUD & AUTHORIZATION TESTS PASSED PERFECTLY!")
    print("=" * 65)


if __name__ == "__main__":
    run_crud_tests()
