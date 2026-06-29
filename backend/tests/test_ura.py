import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.property import PropertyProject, PropertyTransaction
from app.core.security import create_access_token

def get_auth_headers(email: str, role: str) -> dict:
    token = create_access_token(subject=email, role=role, tenant_id="propintel")
    return {"Authorization": f"Bearer {token}"}

def test_trigger_sync_unauthorized(client: TestClient):
    # Standard buyer should be rejected from triggering sync
    headers = get_auth_headers("buyer@propintel.ai", "buyer")
    res = client.post("/api/v1/ura/trigger-sync?use_mock=true", headers=headers)
    assert res.status_code == 403

def test_trigger_sync_authorized_admin(client: TestClient):
    # Admin should be allowed to trigger sync
    headers = get_auth_headers("admin@propintel.ai", "admin")
    res = client.post("/api/v1/ura/trigger-sync?use_mock=true", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "Success"
    assert data["new_transactions_ingested"] > 0
    assert data["new_projects_created"] > 0

def test_incremental_sync_skips_duplicates(client: TestClient, db: Session):
    headers = get_auth_headers("admin@propintel.ai", "admin")
    
    # Clean any transactions that might have carried over from previous tests
    db.query(PropertyTransaction).delete()
    db.query(PropertyProject).delete()
    db.commit()

    # First sync run
    res1 = client.post("/api/v1/ura/trigger-sync?use_mock=true", headers=headers)
    assert res1.status_code == 200
    initial_transactions_count = db.query(PropertyTransaction).count()
    assert initial_transactions_count > 0

    # Second sync run (Incremental Sync)
    res2 = client.post("/api/v1/ura/trigger-sync?use_mock=true", headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    
    # Assert no new records are added, and all are marked as duplicates
    assert data2["new_transactions_ingested"] == 0
    assert data2["duplicates_skipped"] == initial_transactions_count
    
    # Assert database total remains unchanged
    assert db.query(PropertyTransaction).count() == initial_transactions_count

def test_pipeline_status(client: TestClient):
    headers = get_auth_headers("admin@propintel.ai", "admin")
    # Trigger sync to populate data first
    sync_res = client.post("/api/v1/ura/trigger-sync?use_mock=true", headers=headers)
    assert sync_res.status_code == 200

    res = client.get("/api/v1/ura/status", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_projects" in data
    assert "total_transactions" in data
    assert data["total_transactions"] > 0

def test_list_transactions(client: TestClient):
    admin_headers = get_auth_headers("admin@propintel.ai", "admin")
    # Trigger sync to populate data first
    sync_res = client.post("/api/v1/ura/trigger-sync?use_mock=true", headers=admin_headers)
    assert sync_res.status_code == 200

    # Any role can query transactions for market intelligence
    headers = get_auth_headers("buyer@propintel.ai", "buyer")
    res = client.get("/api/v1/ura/transactions?limit=5", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    tx = data[0]
    assert "project_name" in tx
    assert "psf" in tx
    assert "area_sqft" in tx
    # Verify exact calculations (sqft and psf conversions)
    assert tx["area_sqft"] == pytest.approx(tx["area_sqm"] * 10.7639, 0.01)
    assert tx["psf"] == pytest.approx(tx["price"] / tx["area_sqft"], 0.01)
