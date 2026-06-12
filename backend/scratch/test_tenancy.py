import sys
import httpx

# Add backend directory to sys path
sys.path.append("/home/annamalai/GitHub/PROPINTEL/backend")

from app.core.security import create_access_token

def test_tenant_api():
    print("--- Running SaaS Multi-Tenancy Integration Tests ---")
    client = httpx.Client(base_url="http://localhost:8000")
    
    # 1. Onboard a new tenant 'huttons'
    tenant_payload = {
        "id": "huttons",
        "name": "Huttons Asia",
        "domain": "huttons.propintel.ai",
        "logo_url": "https://example.com/huttons.png",
        "primary_color": "#0891b2"
      }
    res = client.post("/api/v1/tenants/register", json=tenant_payload)
    print(f"POST /api/v1/tenants/register status: {res.status_code}")
    assert res.status_code in (200, 201)
    assert res.json()["id"] == "huttons"
    assert res.json()["primary_color"] == "#0891b2"
    print("Tenant onboarding: PASS")
    
    # 2. Verify header-based tenant resolution
    headers = {"X-Tenant-ID": "huttons"}
    res = client.get("/api/v1/tenants/me", headers=headers)
    print(f"GET /api/v1/tenants/me status: {res.status_code}, name: {res.json()['name']}")
    assert res.status_code == 200
    assert res.json()["id"] == "huttons"
    print("Header-based tenant resolution: PASS")

    # 3. Create access token for an admin member of huttons
    admin_token = create_access_token(subject="admin.huttons@propintel.ai", role="admin", tenant_id="huttons")
    auth_headers = {
        "Authorization": f"Bearer {admin_token}",
        "X-Tenant-ID": "huttons"
    }

    # 4. Invite a member to huttons organization
    invite_payload = {
        "email": "agent.smith.huttons@propintel.ai",
        "full_name": "Smith Huttons",
        "role": "agent"
    }
    res = client.post("/api/v1/tenants/members/invite", json=invite_payload, headers=auth_headers)
    print(f"POST /api/v1/tenants/members/invite status: {res.status_code}")
    assert res.status_code == 200
    assert res.json()["email"] == "agent.smith.huttons@propintel.ai"
    assert res.json()["tenant_id"] == "huttons"
    print("Member invitation workflow: PASS")

    # 5. List team members and verify isolation
    res = client.get("/api/v1/tenants/members", headers=auth_headers)
    print(f"GET /api/v1/tenants/members status: {res.status_code}, count: {len(res.json())}")
    assert res.status_code == 200
    # Make sure all members returned have huttons as tenant_id
    for m in res.json():
        assert m["tenant_id"] == "huttons"
    print("Team roster listing & isolation: PASS")
    
    # 6. Update branding (admin only)
    branding_payload = {
        "logo_url": "https://example.com/huttons-new.png",
        "primary_color": "#d97706" # change to Amber
    }
    res = client.put("/api/v1/tenants/branding", json=branding_payload, headers=auth_headers)
    print(f"PUT /api/v1/tenants/branding status: {res.status_code}, color: {res.json()['primary_color']}")
    assert res.status_code == 200
    assert res.json()["primary_color"] == "#d97706"
    print("Branding update check: PASS")
    
    print("\nAll Multi-Tenant API Tests Passed Successfully!")

if __name__ == "__main__":
    try:
        test_tenant_api()
    except Exception as e:
        print(f"\nTest Execution Failed: {e}")
        sys.exit(1)
