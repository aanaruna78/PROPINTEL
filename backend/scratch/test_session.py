import requests
import json
import time

API_URL = "http://localhost:8000/api/v1"

def run_session_tests():
    print("--- Running E2E Session & Token Management (STORY-02-004) Tests ---")
    
    # 1. Register a new user and retrieve token pair
    register_payload = {
        "full_name": "Session Tester",
        "email": "session_test@propintel.ai",
        "password": "password123",
        "role": "buyer",
        "mobile_number": "+65 9876 5432"
    }
    
    print("\n[STEP 1] Registering user 'session_test@propintel.ai'...")
    res = requests.post(f"{API_URL}/auth/register", json=register_payload)
    if res.status_code != 201:
        # If already registered, try logging in
        print("User already registered, logging in instead...")
        login_payload = {
            "email": "session_test@propintel.ai",
            "password": "password123"
        }
        res = requests.post(f"{API_URL}/auth/login", json=login_payload)
        
    assert res.status_code in (200, 201), f"Auth failed: {res.text}"
    tokens = res.json()
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]
    print(f"  [PASS] Tokens retrieved successfully!")
    print(f"         Access Token (partial): {access_token[:20]}...")
    print(f"         Refresh Token (partial): {refresh_token[:20]}...")
    
    # 2. Call /me profile to check access token validity
    print("\n[STEP 2] Fetching user profile using access token...")
    headers = {"Authorization": f"Bearer {access_token}"}
    res = requests.get(f"{API_URL}/auth/me", headers=headers)
    assert res.status_code == 200, f"Profile fetch failed: {res.text}"
    profile = res.json()
    assert profile["email"] == "session_test@propintel.ai"
    print(f"  [PASS] Profile fetched successfully for user: {profile['full_name']}")
    
    # 3. Retrieve active sessions list
    print("\n[STEP 3] Fetching active sessions for the user...")
    res = requests.get(f"{API_URL}/auth/sessions", headers=headers)
    assert res.status_code == 200, f"Fetch sessions failed: {res.text}"
    sessions = res.json()
    print(f"  [PASS] Active sessions list size: {len(sessions)}")
    
    # Identify sessions
    current_session = None
    wa_session = None
    for s in sessions:
        print(f"         Session ID: {s['session_id']} | Device: {s['device']} | Channel: {s['channel']} | Current: {s['is_current']}")
        if s["is_current"]:
            current_session = s
        if s["channel"] == "whatsapp":
            wa_session = s
            
    assert current_session is not None, "Current session not identified"
    assert wa_session is not None, "WhatsApp seed session not found"
    
    # 4. Refresh token rotation test
    print("\n[STEP 4] Refreshing token using refresh token (rotation check)...")
    refresh_payload = {"refresh_token": refresh_token}
    res = requests.post(f"{API_URL}/auth/refresh", json=refresh_payload)
    assert res.status_code == 200, f"Token refresh failed: {res.text}"
    new_tokens = res.json()
    new_access_token = new_tokens["access_token"]
    new_refresh_token = new_tokens["refresh_token"]
    print("  [PASS] Refresh token rotated successfully!")
    print(f"         New Access Token (partial): {new_access_token[:20]}...")
    print(f"         New Refresh Token (partial): {new_refresh_token[:20]}...")
    
    # 5. Verify old access token is revoked immediately
    print("\n[STEP 5] Testing request with rotated/invalidated old access token...")
    res = requests.get(f"{API_URL}/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert res.status_code == 401, f"Old access token was not revoked! Code: {res.status_code}"
    print("  [PASS] Request rejected with 401 (rotated access token successfully blocklisted)")
    
    # 6. Verify new access token works
    print("\n[STEP 6] Testing request with new access token...")
    new_headers = {"Authorization": f"Bearer {new_access_token}"}
    res = requests.get(f"{API_URL}/auth/me", headers=new_headers)
    if res.status_code != 200:
        print(f"      [DEBUG] Status: {res.status_code}, Text: {res.text}")
    assert res.status_code == 200, "New access token did not work"
    print("  [PASS] New access token authorized successfully")
    
    # 7. Force revoke specific active session (WhatsApp session)
    print(f"\n[STEP 7] Revoking WhatsApp session (ID: {wa_session['session_id']})...")
    res = requests.post(f"{API_URL}/auth/sessions/{wa_session['session_id']}/revoke", headers=new_headers)
    assert res.status_code == 200, f"Session revocation failed: {res.text}"
    print("  [PASS] Session revocation returned 200")
    
    # Check that WhatsApp session is gone
    res = requests.get(f"{API_URL}/auth/sessions", headers=new_headers)
    sessions_after = res.json()
    has_wa = any(s["session_id"] == wa_session["session_id"] for s in sessions_after)
    assert not has_wa, "WhatsApp session is still present after revocation"
    print("  [PASS] WhatsApp session successfully deleted from active sessions list")
    
    # 8. Call logout to invalidate all tokens immediately
    print("\n[STEP 8] Logging out from current session...")
    res = requests.post(f"{API_URL}/auth/logout", headers=new_headers)
    assert res.status_code == 200, f"Logout failed: {res.text}"
    print("  [PASS] Logout endpoint returned 200")
    
    # 9. Verify new access token is rejected
    print("\n[STEP 9] Testing request with logged-out access token...")
    res = requests.get(f"{API_URL}/auth/me", headers=new_headers)
    assert res.status_code == 401, f"Access token was not blocklisted on logout! Code: {res.status_code}"
    print("  [PASS] Request rejected with 401 (logged-out access token successfully blocklisted)")
    
    # 10. Display Audit Log Events
    print("\n[STEP 10] Reading logs/audit_events.log file for compliance verify...")
    try:
        with open("logs/audit_events.log", "r") as f:
            lines = f.readlines()
            print(f"  Read {len(lines)} total audit compliance log entries. Printing last 5 entries:")
            for line in lines[-5:]:
                entry = json.loads(line.strip())
                print(f"    - [{entry['timestamp']}] Event: {entry['event']} | User: {entry['email']} | Details: {json.dumps(entry['details'])}")
        print("\n  [PASS] Audit compliance logging verified successfully!")
    except Exception as log_err:
        print(f"  [FAIL] Failed to read/parse audit log: {log_err}")
        raise log_err
        
    print("\n--- All 10 Session & Token Management Test Cases PASSED! ---")

if __name__ == "__main__":
    run_session_tests()
