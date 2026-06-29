from sqlalchemy.orm import Session
from app.models.property import PropertyProject, PropertyTransaction
from typing import List, Dict, Any

TOWNS = ["Ang Mo Kio", "Bedok", "Punggol", "Tampines", "Woodlands", "Yishun"]
FLAT_TYPES = ["3-Room", "4-Room", "5-Room", "Executive"]

# Realistic base parameters for Singapore HDB towns (4-Room flat base value)
TOWN_PROFILES = {
    "Ang Mo Kio": {"base_price": 620000, "base_rent": 3300, "liquidity": 78, "dom": 28, "turnover": 1.4},
    "Bedok": {"base_price": 530000, "base_rent": 3000, "liquidity": 72, "dom": 32, "turnover": 1.2},
    "Punggol": {"base_price": 590000, "base_rent": 3400, "liquidity": 88, "dom": 19, "turnover": 2.2},
    "Tampines": {"base_price": 560000, "base_rent": 3200, "liquidity": 82, "dom": 23, "turnover": 1.7},
    "Woodlands": {"base_price": 460000, "base_rent": 2800, "liquidity": 68, "dom": 38, "turnover": 1.3},
    "Yishun": {"base_price": 480000, "base_rent": 2900, "liquidity": 70, "dom": 35, "turnover": 1.1}
}

# Multipliers based on flat size/type
FLAT_MULTIPLIERS = {
    "3-Room": {"price": 0.75, "rent": 0.82},
    "4-Room": {"price": 1.0, "rent": 1.0},
    "5-Room": {"price": 1.28, "rent": 1.18},
    "Executive": {"price": 1.55, "rent": 1.35}
}

def get_hdb_towns() -> List[str]:
    return TOWNS

def get_hdb_flat_types() -> List[str]:
    return FLAT_TYPES

def get_market_intelligence(db: Session, town: str, flat_type: str) -> Dict[str, Any]:
    # Normalise input params
    normalised_town = next((t for t in TOWNS if t.lower() == town.lower()), "Tampines")
    normalised_type = next((f for f in FLAT_TYPES if f.replace(" ", "").lower() == flat_type.replace(" ", "").lower()), "4-Room")

    # 1. Attempt to query database for matching HDB projects
    db_projects = db.query(PropertyProject).filter(
        PropertyProject.project_type == "HDB",
        PropertyProject.district.like(f"%{normalised_town}%")
    ).all()

    # If database contains matching project transactions, we could calculate aggregate metrics here.
    # However, since this is local/offline mode, we fall back to high-fidelity, deterministic mock data
    # generated from Singapore market baseline profiles.
    
    profile = TOWN_PROFILES[normalised_town]
    mults = FLAT_MULTIPLIERS[normalised_type]
    
    current_price = profile["base_price"] * mults["price"]
    current_rent = profile["base_rent"] * mults["rent"]
    
    # Calculate historical resale trends (last 4 quarters)
    quarters = ["2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4"]
    trend_factors = [0.965, 0.980, 0.992, 1.0]  # Show steady growth
    resale_trends = []
    
    for idx, q in enumerate(quarters):
        factor = trend_factors[idx]
        q_price = round(current_price * factor, -3)
        # Average size estimation: 3-Room = 700sqft, 4-Room = 1000sqft, 5-Room = 1200sqft, Exec = 1400sqft
        sizes = {"3-Room": 700, "4-Room": 1000, "5-Room": 1200, "Executive": 1400}
        size_sqft = sizes[normalised_type]
        q_psf = round(q_price / size_sqft, 2)
        q_volume = int(round(120 * factor * (1.5 if normalised_type == "4-Room" else 1.0)))
        
        resale_trends.append({
            "quarter": q,
            "avg_price": q_price,
            "avg_psf": q_psf,
            "volume": q_volume
        })

    # Rental analysis
    annual_rent = current_rent * 12
    rental_yield = round((annual_rent / current_price) * 100, 2)
    
    # Calculate active listing count (realistic volume)
    active_listings = int(round(45 * profile["turnover"] * mults["price"]))
    
    # Rental pressure: demand vs supply indicator (0 to 10 scale)
    rental_pressure = round(profile["liquidity"] / 10.0 + (0.5 if normalised_type in ["3-Room", "4-Room"] else 0.0), 1)
    
    rental_analysis = {
        "avg_rent": round(current_rent, -1),
        "active_listings": active_listings,
        "rental_yield": rental_yield,
        "rental_pressure": min(rental_pressure, 10.0)
    }

    # Liquidity scoring
    liquidity_score = profile["liquidity"]
    # Adjust score slightly for flat types (4-Room has highest demand)
    if normalised_type == "4-Room":
        liquidity_score = min(liquidity_score + 4, 100)
    elif normalised_type == "Executive":
        liquidity_score = max(liquidity_score - 6, 0)
        
    rating = "High" if liquidity_score >= 80 else ("Moderate" if liquidity_score >= 65 else "Low")
    dom_adjustment = -3 if normalised_type == "4-Room" else (4 if normalised_type == "Executive" else 0)
    avg_days = max(profile["dom"] + dom_adjustment, 10)
    
    liquidity = {
        "liquidity_score": round(liquidity_score, 1),
        "rating": rating,
        "avg_days_on_market": int(avg_days),
        "turnover_rate": round(profile["turnover"] * (1.2 if normalised_type == "4-Room" else 0.9), 2)
    }

    return {
        "town": normalised_town,
        "flat_type": normalised_type,
        "resale_trends": resale_trends,
        "rental_analysis": rental_analysis,
        "liquidity": liquidity
    }
