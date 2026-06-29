import pytest

def test_chat_unauthenticated(client):
    """Test that chat endpoint rejects unauthenticated requests."""
    payload = {
        "message": "Hello",
        "history": []
    }
    response = client.post("/api/v1/chat/message", json=payload)
    assert response.status_code == 401

def test_chat_general_greeting(client, auth_headers):
    """Test general query/greeting response."""
    payload = {
        "message": "Hi there!",
        "history": []
    }
    response = client.post("/api/v1/chat/message", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert data["intent"] == "general"
    assert "AI Property Advisor" in data["response"]
    assert data["metadata"] is None

def test_chat_property_search_by_district(client, auth_headers):
    """Test property search by district D01."""
    payload = {
        "message": "Find properties in D01",
        "history": []
    }
    response = client.post("/api/v1/chat/message", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "search_properties"
    assert "properties" in data["metadata"]
    assert len(data["metadata"]["properties"]) > 0
    # D01 properties: Marina One Residences, The Sail @ Marina Bay
    names = [p["name"] for p in data["metadata"]["properties"]]
    assert any("Marina One" in n for n in names)

def test_chat_property_search_by_name(client, auth_headers):
    """Test property search by project name."""
    payload = {
        "message": "Tell me about Reflections at Keppel Bay",
        "history": []
    }
    response = client.post("/api/v1/chat/message", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "search_properties"
    assert "properties" in data["metadata"]
    names = [p["name"] for p in data["metadata"]["properties"]]
    assert any("Reflections" in n for n in names)

def test_chat_hdb_intelligence(client, auth_headers):
    """Test HDB market intelligence parsing for Yishun 4-Room flat type."""
    payload = {
        "message": "Show me HDB market intelligence for Yishun 4-Room flats",
        "history": []
    }
    response = client.post("/api/v1/chat/message", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "hdb_intel"
    assert "hdb_intel" in data["metadata"]
    assert data["metadata"]["hdb_intel"]["town"] == "Yishun"
    assert data["metadata"]["hdb_intel"]["flat_type"] == "4-Room"
    assert "avg_price" in data["metadata"]["hdb_intel"]["resale_trends"][0]

def test_chat_market_pulse(client, auth_headers):
    """Test market pulse intent matching."""
    payload = {
        "message": "What is the overall market pulse and momentum?",
        "history": []
    }
    response = client.post("/api/v1/chat/message", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "market_pulse"
    assert "market_pulse" in data["metadata"]
    assert "market_momentum" in data["metadata"]["market_pulse"]

def test_chat_refinement_rental_yield(client, auth_headers):
    """Test multi-turn context refinement for rental yield of previous property search."""
    history = [
        {"role": "user", "content": "Find properties in D01"},
        {
            "role": "assistant",
            "content": "I found these properties...",
            "metadata": {
                "properties": [
                    {
                        "id": 1,
                        "name": "Marina One Residences",
                        "project_type": "Condo",
                        "district": "D01",
                        "fair_value_psf": 2450.0,
                        "rental_yield_estimate": 4.8
                    }
                ]
            }
        }
    ]
    payload = {
        "message": "what is its rental yield?",
        "history": history
    }
    response = client.post("/api/v1/chat/message", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "search_properties"
    assert "properties" in data["metadata"]
    assert data["metadata"]["properties"][0]["name"] == "Marina One Residences"
    assert "4.8%" in data["response"]

def test_chat_refinement_bedrooms(client, auth_headers):
    """Test multi-turn context refinement for layout size filter of previous property search."""
    history = [
        {"role": "user", "content": "Show me Reflections"},
        {
            "role": "assistant",
            "content": "I found Reflections...",
            "metadata": {
                "properties": [
                    {
                        "id": 3,
                        "name": "Reflections at Keppel Bay",
                        "project_type": "Condo",
                        "district": "D04",
                        "fair_value_psf": 1750.0,
                        "rental_yield_estimate": 3.5
                    }
                ]
            }
        }
    ]
    payload = {
        "message": "Show me typical prices for 3 bedrooms",
        "history": history
    }
    response = client.post("/api/v1/chat/message", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "search_properties"
    assert "properties" in data["metadata"]
    assert "Reflections at Keppel Bay" in data["response"]
    assert "SGD 1,750,000" in data["response"] # PSF 1750 * 1000 sqft
