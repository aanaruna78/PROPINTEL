import pytest
from app.models.user import User

def test_register_and_login_success(client, db):
    # 1. Register a new user
    register_payload = {
        "email": "test_user@propintel.ai",
        "password": "password123",
        "full_name": "Test User",
        "role": "buyer",
        "mobile_number": "+65 9123 4567",
        "tenant_id": "propintel"
    }
    
    response = client.post("/api/v1/auth/register", json=register_payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

    # Verify user was saved in DB
    user = db.query(User).filter(User.email == "test_user@propintel.ai").first()
    assert user is not None
    assert user.full_name == "Test User"
    assert user.role == "buyer"

    # 2. Login with registered user
    login_payload = {
        "email": "test_user@propintel.ai",
        "password": "password123"
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    login_data = response.json()
    assert "access_token" in login_data
    assert "refresh_token" in login_data

def test_login_invalid_credentials(client):
    login_payload = {
        "email": "nonexistent@propintel.ai",
        "password": "wrongpassword"
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect email or password"

def test_get_me_profile(client):
    # Register and get token
    register_payload = {
        "email": "profile_test@propintel.ai",
        "password": "password123",
        "full_name": "Profile Tester",
        "role": "buyer"
    }
    resp = client.post("/api/v1/auth/register", json=register_payload)
    token = resp.json()["access_token"]

    # Call /me endpoint
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    profile = response.json()
    assert profile["email"] == "profile_test@propintel.ai"
    assert profile["full_name"] == "Profile Tester"

def test_session_lifecycle(client):
    register_payload = {
        "email": "session_lifecycle@propintel.ai",
        "password": "password123",
        "full_name": "Session Life Tester",
        "role": "buyer"
    }
    resp = client.post("/api/v1/auth/register", json=register_payload)
    tokens = resp.json()
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    headers = {"Authorization": f"Bearer {access_token}"}
    
    # List active sessions
    response = client.get("/api/v1/auth/sessions", headers=headers)
    assert response.status_code == 200
    sessions = response.json()
    assert len(sessions) > 0
    
    # We should have a current session and some seeded ones
    current_session = next((s for s in sessions if s["is_current"]), None)
    assert current_session is not None
    
    whatsapp_session = next((s for s in sessions if s["channel"] == "whatsapp"), None)
    assert whatsapp_session is not None

    # Revoke WhatsApp session
    session_id = whatsapp_session["session_id"]
    response = client.post(f"/api/v1/auth/sessions/{session_id}/revoke", headers=headers)
    assert response.status_code == 200
    assert "successfully revoked" in response.json()["message"]

    # Verify session is revoked
    response = client.get("/api/v1/auth/sessions", headers=headers)
    sessions_after = response.json()
    assert not any(s["session_id"] == session_id for s in sessions_after)

    # Refresh tokens
    refresh_payload = {"refresh_token": refresh_token}
    response = client.post("/api/v1/auth/refresh", json=refresh_payload)
    assert response.status_code == 200
    new_tokens = response.json()
    assert "access_token" in new_tokens
    
    # Logout
    response = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {new_tokens['access_token']}"})
    assert response.status_code == 200

def test_forgot_and_reset_password(client):
    register_payload = {
        "email": "reset_test@propintel.ai",
        "password": "oldpassword",
        "full_name": "Reset Tester",
        "role": "buyer"
    }
    client.post("/api/v1/auth/register", json=register_payload)

    # Forgot password
    forgot_payload = {"email": "reset_test@propintel.ai"}
    response = client.post("/api/v1/auth/forgot-password", json=forgot_payload)
    assert response.status_code == 200
    assert "Password reset code sent" in response.json()["message"]

    # Reset password with incorrect code
    reset_payload_fail = {
        "email": "reset_test@propintel.ai",
        "code": "111222",
        "new_password": "newpassword123"
    }
    response = client.post("/api/v1/auth/reset-password", json=reset_payload_fail)
    assert response.status_code == 400

    # Reset password with correct code
    reset_payload_success = {
        "email": "reset_test@propintel.ai",
        "code": "654321",
        "new_password": "newpassword123"
    }
    response = client.post("/api/v1/auth/reset-password", json=reset_payload_success)
    assert response.status_code == 200

    # Login with new password
    login_payload = {
        "email": "reset_test@propintel.ai",
        "password": "newpassword123"
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
