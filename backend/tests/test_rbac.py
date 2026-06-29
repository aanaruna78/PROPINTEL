import pytest
from app.core.security import create_access_token

def test_rbac_access_matrix(client):
    roles = ["buyer", "seller", "investor", "tenant", "landlord", "agency_manager", "admin"]
    tokens = {}
    
    # Generate JWT tokens for all roles
    for role in roles:
        tokens[role] = create_access_token(
            subject=f"test.{role}@propintel.ai", 
            role=role, 
            tenant_id="era" if role == "agency_manager" else "propintel"
        )
        
    rbac_endpoints = {
        "/api/v1/rbac/buyer/war-room": ["buyer", "admin"],
        "/api/v1/rbac/seller/analytics": ["seller", "admin"],
        "/api/v1/rbac/investor/signals": ["investor", "admin"],
        "/api/v1/rbac/tenant/matchmaking": ["tenant", "admin"],
        "/api/v1/rbac/landlord/yield": ["landlord", "admin"],
        "/api/v1/rbac/agency-manager/leads": ["agency_manager", "admin"],
        "/api/v1/rbac/admin/governance": ["admin"]
    }

    for endpoint, allowed_roles in rbac_endpoints.items():
        for role, token in tokens.items():
            headers = {"Authorization": f"Bearer {token}"}
            response = client.get(endpoint, headers=headers)
            
            should_allow = role in allowed_roles
            if should_allow:
                assert response.status_code == 200, f"Role {role} should have access to {endpoint} but got {response.status_code}"
                assert response.json()["role"] == (role if role != "admin" else response.json()["role"])
            else:
                assert response.status_code == 403, f"Role {role} should be denied access to {endpoint} but got {response.status_code}"
