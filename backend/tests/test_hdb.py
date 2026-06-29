import pytest

def test_get_hdb_towns(client):
    response = client.get("/api/v1/hdb/towns")
    assert response.status_code == 200
    towns = response.json()
    assert isinstance(towns, list)
    assert "Tampines" in towns
    assert "Punggol" in towns
    assert "Ang Mo Kio" in towns

def test_get_hdb_flat_types(client):
    response = client.get("/api/v1/hdb/flat-types")
    assert response.status_code == 200
    types = response.json()
    assert isinstance(types, list)
    assert "3-Room" in types
    assert "4-Room" in types
    assert "5-Room" in types
    assert "Executive" in types

@pytest.mark.parametrize("town,flat_type", [
    ("Tampines", "4-Room"),
    ("Punggol", "5-Room"),
    ("Woodlands", "3-Room"),
    ("Ang Mo Kio", "Executive")
])
def test_get_market_intelligence_parameters(client, town, flat_type):
    response = client.get(f"/api/v1/hdb/market-intelligence?town={town}&flat_type={flat_type}")
    assert response.status_code == 200
    data = response.json()
    
    assert data["town"] == town
    assert data["flat_type"] == flat_type
    
    # Resale trends checks
    assert "resale_trends" in data
    assert len(data["resale_trends"]) == 4
    for pt in data["resale_trends"]:
        assert "quarter" in pt
        assert "avg_price" in pt
        assert "avg_psf" in pt
        assert "volume" in pt
        assert pt["avg_price"] > 0
        assert pt["avg_psf"] > 0
        assert pt["volume"] >= 0

    # Rental check
    assert "rental_analysis" in data
    rental = data["rental_analysis"]
    assert rental["avg_rent"] > 0
    assert rental["active_listings"] > 0
    assert 0 <= rental["rental_yield"] <= 20
    assert 0 <= rental["rental_pressure"] <= 10

    # Liquidity check
    assert "liquidity" in data
    liq = data["liquidity"]
    assert 0 <= liq["liquidity_score"] <= 100
    assert liq["rating"] in ["High", "Moderate", "Low"]
    assert liq["avg_days_on_market"] > 0
    assert liq["turnover_rate"] > 0

def test_rental_yield_math(client):
    town = "Tampines"
    flat_type = "4-Room"
    response = client.get(f"/api/v1/hdb/market-intelligence?town={town}&flat_type={flat_type}")
    assert response.status_code == 200
    data = response.json()
    
    avg_rent = data["rental_analysis"]["avg_rent"]
    rental_yield = data["rental_analysis"]["rental_yield"]
    
    # Current resale price is the last point in resale_trends (Q4)
    resale_price = data["resale_trends"][-1]["avg_price"]
    
    # Formula check: yield = (rent * 12) / price * 100
    expected_yield = round(((avg_rent * 12) / resale_price) * 100, 2)
    assert rental_yield == expected_yield
