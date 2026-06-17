import pytest
from app.models.property import DistrictMonthlyStats

def test_get_latest_district_stats(client, auth_headers):
    response = client.get("/api/v1/analytics/districts", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    
    # Check that D01 and other key districts are present
    districts = [item["district"] for item in data]
    assert "D01" in districts
    assert "D09" in districts
    assert "D15" in districts
    
    # Check fields in the first item
    first_item = data[0]
    assert "district" in first_item
    assert "name" in first_item
    assert "coords" in first_item
    assert "avg_price_psf" in first_item
    assert "price_movement_percent" in first_item
    assert "rental_pressure" in first_item
    assert "buyer_activity" in first_item
    assert "demand_index" in first_item
    assert "transaction_count" in first_item
    
    # Validate value constraints
    assert 1.0 <= first_item["demand_index"] <= 10.0
    assert 1.0 <= first_item["rental_pressure"] <= 10.0
    assert 1.0 <= first_item["buyer_activity"] <= 10.0
    assert first_item["avg_price_psf"] > 0
    assert len(first_item["coords"]) == 2

def test_get_district_historical_trends(client, auth_headers):
    response = client.get("/api/v1/analytics/districts/D01/trends", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 7  # 7 months configured in MONTH_TRENDS
    
    for point in data:
        assert "month" in point
        assert "avg_price_psf" in point
        assert "price_movement_percent" in point
        assert "demand_index" in point
        assert 1.0 <= point["demand_index"] <= 10.0
        assert point["avg_price_psf"] > 0

def test_get_district_trends_not_found(client, auth_headers):
    # D99 is not a valid district code in DISTRICTS_INFO, so it should return 404
    response = client.get("/api/v1/analytics/districts/D99/trends", headers=auth_headers)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_trigger_aggregation(client, db, auth_headers):
    # Direct check of DistrictMonthlyStats count in DB before trigger
    count_before = db.query(DistrictMonthlyStats).count()
    
    response = client.post("/api/v1/analytics/districts/trigger-aggregation", headers=auth_headers)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "Success"
    assert res_data["records_created"] == 28 * 7 # 28 districts * 7 months
    
    # Count after trigger should match
    count_after = db.query(DistrictMonthlyStats).count()
    assert count_after == 28 * 7

def test_get_district_summary(client, auth_headers):
    """Test the new single-district summary endpoint."""
    response = client.get("/api/v1/analytics/districts/D09", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    
    assert data["district"] == "D09"
    assert data["name"] == "Orchard / River Valley"
    assert len(data["coords"]) == 2
    assert data["avg_price_psf"] > 0
    assert 1.0 <= data["demand_index"] <= 10.0
    assert "trends" in data
    assert len(data["trends"]) == 7  # 7 months of trends

def test_get_district_summary_not_found(client, auth_headers):
    """Test that an invalid district returns 404 from the summary endpoint."""
    response = client.get("/api/v1/analytics/districts/D99", headers=auth_headers)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_get_top_districts_by_demand(client, auth_headers):
    """Test the top-N districts endpoint for demand_index metric."""
    response = client.get("/api/v1/analytics/districts/top/demand_index?n=5", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 5
    
    # Verify results are sorted descending by demand_index
    demand_scores = [item["demand_index"] for item in data]
    assert demand_scores == sorted(demand_scores, reverse=True)

def test_get_top_districts_invalid_metric(client, auth_headers):
    """Test that an invalid metric returns 400."""
    response = client.get("/api/v1/analytics/districts/top/invalid_metric", headers=auth_headers)
    assert response.status_code == 400
    assert "invalid metric" in response.json()["detail"].lower()

def test_unauthenticated_access(client):
    """Test that endpoints return 401 without auth."""
    response = client.get("/api/v1/analytics/districts")
    assert response.status_code == 401
