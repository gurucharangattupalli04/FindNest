"""
Comprehensive test script for FindNest Step 4: Authentication.
Verifies registration, password hashing (Argon2), login, JWT token issuance,
/api/v1/auth/me profile retrieval, and error states.
"""
import sys
import time
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app
from app.db.session import engine, SessionLocal
from app.models.user import User

client = TestClient(app)


def run_auth_tests():
    print("=" * 65)
    print("FindNest: Authentication & Security Verification Suite")
    print("=" * 65)

    timestamp = int(time.time())
    test_email = f"auth.test.{timestamp}@findnest.org"
    test_password = "SecurePassword2026!"
    test_full_name = "Morgan Freeman"

    # -------------------------------------------------------------
    # 1. User Registration
    # -------------------------------------------------------------
    print("\n[Test 1/8] Registering a new user...")
    register_payload = {
        "email": test_email,
        "full_name": test_full_name,
        "password": test_password,
        "phone_number": "+1-555-0188"
    }
    reg_res = client.post("/api/v1/auth/register", json=register_payload)
    print(f"  Response Status: {reg_res.status_code}")
    assert reg_res.status_code == 201, f"Expected 201, got {reg_res.status_code}: {reg_res.text}"
    user_data = reg_res.json()
    print(f"  Registered User ID: {user_data.get('id')}, Email: {user_data.get('email')}")
    assert user_data.get("email") == test_email.lower()
    assert "hashed_password" not in user_data, "SECURITY ALERT: hashed_password exposed in registration response!"
    assert "password" not in user_data, "SECURITY ALERT: password exposed in registration response!"
    print("  PASS: Registration succeeded and response contains no sensitive password fields.")

    # -------------------------------------------------------------
    # 2. Database Password Verification (Argon2 Hashed, never plain text)
    # -------------------------------------------------------------
    print("\n[Test 2/8] Inspecting password hash in PostgreSQL database...")
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT id, email, hashed_password FROM users WHERE email = :email"),
            {"email": test_email.lower()}
        ).fetchone()
        assert result is not None, "User was not persisted to PostgreSQL users table!"
        db_id, db_email, db_hash = result
        print(f"  DB Record -> ID: {db_id}, Email: {db_email}")
        print(f"  DB Stored Hash: {db_hash[:30]}...")
        assert db_hash != test_password, "CRITICAL: Password is stored in plain text!"
        assert db_hash.startswith("$argon2"), f"CRITICAL: Password is not an Argon2 hash! Hash: {db_hash}"
    print("  PASS: Password is securely hashed with Argon2 in PostgreSQL.")

    # -------------------------------------------------------------
    # 3. Duplicate Email Registration Rejection
    # -------------------------------------------------------------
    print("\n[Test 3/8] Testing duplicate email registration rejection...")
    dup_res = client.post("/api/v1/auth/register", json=register_payload)
    print(f"  Response Status: {dup_res.status_code}")
    assert dup_res.status_code == 400, f"Expected 400 Bad Request, got {dup_res.status_code}"
    print(f"  Detail: {dup_res.json().get('detail')}")
    print("  PASS: Duplicate email correctly rejected with HTTP 400.")

    # -------------------------------------------------------------
    # 4. Login with Incorrect Password
    # -------------------------------------------------------------
    print("\n[Test 4/8] Testing login with incorrect password...")
    bad_login_payload = {
        "email": test_email,
        "password": "WrongPassword999!"
    }
    bad_login_res = client.post("/api/v1/auth/login", json=bad_login_payload)
    print(f"  Response Status: {bad_login_res.status_code}")
    assert bad_login_res.status_code == 401, f"Expected 401 Unauthorized, got {bad_login_res.status_code}"
    print(f"  Detail: {bad_login_res.json().get('detail')}")
    print("  PASS: Incorrect credentials rejected with HTTP 401.")

    # -------------------------------------------------------------
    # 5. Login with Correct Credentials (JWT Token Issuance)
    # -------------------------------------------------------------
    print("\n[Test 5/8] Logging in with valid credentials...")
    login_payload = {
        "email": test_email,
        "password": test_password
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    print(f"  Response Status: {login_res.status_code}")
    assert login_res.status_code == 200, f"Expected 200 OK, got {login_res.status_code}: {login_res.text}"
    token_body = login_res.json()
    access_token = token_body.get("access_token")
    token_type = token_body.get("token_type")
    logged_user = token_body.get("user")
    print(f"  Token Type: {token_type}")
    print(f"  Access Token: {access_token[:30]}... ({len(access_token)} chars)")
    print(f"  Expires In: {token_body.get('expires_in')}s")
    assert access_token is not None and len(access_token) > 20
    assert token_type == "bearer"
    assert logged_user.get("email") == test_email.lower()
    assert "hashed_password" not in logged_user
    print("  PASS: Successfully logged in and received valid JWT access token.")

    # -------------------------------------------------------------
    # 6. Protected Route: GET /api/v1/auth/me with Valid Token
    # -------------------------------------------------------------
    print("\n[Test 6/8] Accessing GET /api/v1/auth/me with Bearer token...")
    headers = {"Authorization": f"Bearer {access_token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    print(f"  Response Status: {me_res.status_code}")
    assert me_res.status_code == 200, f"Expected 200 OK, got {me_res.status_code}: {me_res.text}"
    me_data = me_res.json()
    print(f"  Current User -> ID: {me_data.get('id')}, Full Name: {me_data.get('full_name')}, Email: {me_data.get('email')}")
    assert me_data.get("email") == test_email.lower()
    assert me_data.get("full_name") == test_full_name
    assert "hashed_password" not in me_data
    print("  PASS: Authenticated profile retrieved successfully.")

    # -------------------------------------------------------------
    # 7. Protected Route: GET /api/v1/auth/me without Token
    # -------------------------------------------------------------
    print("\n[Test 7/8] Accessing GET /api/v1/auth/me with missing Authorization header...")
    no_token_res = client.get("/api/v1/auth/me")
    print(f"  Response Status: {no_token_res.status_code}")
    assert no_token_res.status_code == 401, f"Expected 401 Unauthorized, got {no_token_res.status_code}"
    print("  PASS: Missing token rejected with HTTP 401.")

    # -------------------------------------------------------------
    # 8. Protected Route: GET /api/v1/auth/me with Invalid/Forged Token
    # -------------------------------------------------------------
    print("\n[Test 8/8] Accessing GET /api/v1/auth/me with invalid/forged token...")
    bad_headers = {"Authorization": "Bearer invalid.token.payload.signature"}
    bad_token_res = client.get("/api/v1/auth/me", headers=bad_headers)
    print(f"  Response Status: {bad_token_res.status_code}")
    assert bad_token_res.status_code == 401, f"Expected 401 Unauthorized, got {bad_token_res.status_code}"
    print("  PASS: Invalid/forged token rejected with HTTP 401.")

    print("\n" + "=" * 65)
    print("ALL 8 AUTHENTICATION & SECURITY TESTS PASSED PERFECTLY!")
    print("=" * 65)


if __name__ == "__main__":
    run_auth_tests()
