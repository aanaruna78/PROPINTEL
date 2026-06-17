import pytest
from app.core.security import create_access_token
from app.models.tenant import Tenant
from app.models.user import User

def test_tenant_registration(client, db):
    tenant_payload = {
        "id": "huttons",
        "name": "Huttons Asia",
        "domain": "huttons.propintel.ai",
        "logo_url": "https://example.com/huttons.png",
        "primary_color": "#0891b2"
    }
    
    response = client.post("/api/v1/tenants/register", json=tenant_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == "huttons"
    assert data["primary_color"] == "#0891b2"
    
    # Verify in DB
    tenant = db.query(Tenant).filter(Tenant.id == "huttons").first()
    assert tenant is not None
    assert tenant.name == "Huttons Asia"

def test_header_based_tenant_resolution(client):
    headers = {"X-Tenant-ID": "era"}
    response = client.get("/api/v1/tenants/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["id"] == "era"
    assert response.json()["name"] == "ERA Singapore"

def test_member_invite_and_tenant_isolation(client, db):
    # 1. Onboard huttons tenant
    tenant_payload = {
        "id": "huttons",
        "name": "Huttons Asia",
        "domain": "huttons.propintel.ai",
        "logo_url": "https://example.com/huttons.png",
        "primary_color": "#0891b2"
    }
    client.post("/api/v1/tenants/register", json=tenant_payload)

    # 2. Create tokens for Huttons Admin and ERA Admin
    huttons_admin_token = create_access_token(subject="admin@huttons.com", role="admin", tenant_id="huttons")
    era_admin_token = create_access_token(subject="admin@era.com.sg", role="admin", tenant_id="era")

    # Seed those admin users in the database so get_current_user resolves them from DB
    huttons_admin = User(
        email="admin@huttons.com",
        full_name="Huttons Admin",
        hashed_password="hashedpassword",
        role="admin",
        tenant_id="huttons"
    )
    era_admin = User(
        email="admin@era.com.sg",
        full_name="ERA Admin",
        hashed_password="hashedpassword",
        role="admin",
        tenant_id="era"
    )
    db.add(huttons_admin)
    db.add(era_admin)
    db.commit()

    # 3. Invite Huttons Member
    invite_huttons = {
        "email": "agent.smith@huttons.com",
        "full_name": "Smith Huttons",
        "role": "agent"
    }
    headers_huttons = {
        "Authorization": f"Bearer {huttons_admin_token}",
        "X-Tenant-ID": "huttons"
    }
    response = client.post("/api/v1/tenants/members/invite", json=invite_huttons, headers=headers_huttons)
    assert response.status_code == 200
    assert response.json()["email"] == "agent.smith@huttons.com"
    assert response.json()["tenant_id"] == "huttons"

    # 4. Invite ERA Member
    invite_era = {
        "email": "agent.jones@era.com.sg",
        "full_name": "Jones ERA",
        "role": "agent"
    }
    headers_era = {
        "Authorization": f"Bearer {era_admin_token}",
        "X-Tenant-ID": "era"
    }
    response = client.post("/api/v1/tenants/members/invite", json=invite_era, headers=headers_era)
    assert response.status_code == 200
    assert response.json()["email"] == "agent.jones@era.com.sg"
    assert response.json()["tenant_id"] == "era"

    # 5. List members as Huttons Admin -> Verify isolation (only huttons members returned)
    response = client.get("/api/v1/tenants/members", headers=headers_huttons)
    assert response.status_code == 200
    huttons_members = response.json()
    
    # Assert all returned members belong to Huttons
    assert len(huttons_members) > 0
    for member in huttons_members:
        assert member["tenant_id"] == "huttons"
        assert member["email"] != "agent.jones@era.com.sg"

    # 6. List members as ERA Admin -> Verify isolation
    response = client.get("/api/v1/tenants/members", headers=headers_era)
    assert response.status_code == 200
    era_members = response.json()
    assert len(era_members) > 0
    for member in era_members:
        assert member["tenant_id"] == "era"
        assert member["email"] != "agent.smith@huttons.com"

def test_update_branding_permissions(client, db):
    # Setup test admin and regular user
    admin_token = create_access_token(subject="admin@era.com.sg", role="admin", tenant_id="era")
    buyer_token = create_access_token(subject="buyer@propintel.ai", role="buyer", tenant_id="era")

    admin_user = User(
        email="admin@era.com.sg",
        full_name="ERA Admin",
        hashed_password="hashedpassword",
        role="admin",
        tenant_id="era"
    )
    buyer_user = User(
        email="buyer@propintel.ai",
        full_name="Regular Buyer",
        hashed_password="hashedpassword",
        role="buyer",
        tenant_id="era"
    )
    db.add(admin_user)
    db.add(buyer_user)
    db.commit()

    branding_payload = {
        "logo_url": "https://example.com/era-new.png",
        "primary_color": "#d97706"
    }

    # 1. Update branding as Buyer -> Should fail with 403
    response = client.put(
        "/api/v1/tenants/branding",
        json=branding_payload,
        headers={"Authorization": f"Bearer {buyer_token}", "X-Tenant-ID": "era"}
    )
    assert response.status_code == 403

    # 2. Update branding as Admin -> Should succeed
    response = client.put(
        "/api/v1/tenants/branding",
        json=branding_payload,
        headers={"Authorization": f"Bearer {admin_token}", "X-Tenant-ID": "era"}
    )
    assert response.status_code == 200
    assert response.json()["primary_color"] == "#d97706"
    assert response.json()["logo_url"] == "https://example.com/era-new.png"
