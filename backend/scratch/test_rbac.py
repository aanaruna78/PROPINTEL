import sys
import httpx

# Add backend directory to sys path
sys.path.append("/home/annamalai/GitHub/PROPINTEL/backend")

from app.core.security import create_access_token

def test_rbac_matrix():
    print("--- Running Fine-Grained Role-Based Access Control (RBAC) Tests ---")
    client = httpx.Client(base_url="http://localhost:8000")
    
    # 1. Define roles and generate tokens
    roles = ["buyer", "seller", "investor", "tenant", "landlord", "agency_manager", "admin"]
    tokens = {}
    for role in roles:
        # Generate custom mock tokens
        tokens[role] = create_access_token(
            subject=f"test.{role}@propintel.ai", 
            role=role, 
            tenant_id="era" if role == "agency_manager" else "propintel"
        )
        
    # 2. Define endpoints and the list of permitted roles for each
    rbac_endpoints = {
        "/api/v1/rbac/buyer/war-room": ["buyer", "admin"],
        "/api/v1/rbac/seller/analytics": ["seller", "admin"],
        "/api/v1/rbac/investor/signals": ["investor", "admin"],
        "/api/v1/rbac/tenant/matchmaking": ["tenant", "admin"],
        "/api/v1/rbac/landlord/yield": ["landlord", "admin"],
        "/api/v1/rbac/agency-manager/leads": ["agency_manager", "admin"],
        "/api/v1/rbac/admin/governance": ["admin"]
    }

    # 3. Iterate through endpoints and check access for all role tokens
    print("\nVerifying access control matrix:")
    passed_cases = 0
    failed_cases = 0
    
    for endpoint, allowed_roles in rbac_endpoints.items():
        print(f"\nEndpoint: {endpoint} (Permitted: {', '.join(allowed_roles)})")
        for role, token in tokens.items():
            headers = {"Authorization": f"Bearer {token}"}
            res = client.get(endpoint, headers=headers)
            
            should_allow = role in allowed_roles
            
            if should_allow:
                if res.status_code == 200:
                    print(f"  [PASS] Role: {role:15} -> ALLOWED (200)")
                    passed_cases += 1
                else:
                    print(f"  [FAIL] Role: {role:15} -> expected ALLOWED, but got {res.status_code}")
                    failed_cases += 1
            else:
                if res.status_code == 403:
                    print(f"  [PASS] Role: {role:15} -> DENIED (403)")
                    passed_cases += 1
                else:
                    print(f"  [FAIL] Role: {role:15} -> expected DENIED (403), but got {res.status_code}")
                    failed_cases += 1
                    
    print(f"\n--- Test Results: {passed_cases} passed, {failed_cases} failed ---")
    if failed_cases > 0:
        raise Exception("Some RBAC tests failed!")
    else:
        print("All RBAC Access Matrix Validation Rules PASSED!")

if __name__ == "__main__":
    try:
        test_rbac_matrix()
    except Exception as e:
        print(f"\nTest Execution Failed: {e}")
        sys.exit(1)
