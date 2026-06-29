import os
import random
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.property import PropertyProject, PropertyTransaction, DistrictMonthlyStats

# Baseline data for Singapore's 28 districts (D01-D28)
DISTRICTS_INFO = {
    "D01": {"name": "Marina Bay / Raffles Place", "coords": [1.2834, 103.8509], "base_price": 2300, "base_rent_index": 8.5, "base_buyer_index": 7.8},
    "D02": {"name": "Chinatown / Tanjong Pagar", "coords": [1.2753, 103.8435], "base_price": 2100, "base_rent_index": 8.0, "base_buyer_index": 7.5},
    "D03": {"name": "Queenstown / Tiong Bahru", "coords": [1.2913, 103.8123], "base_price": 1850, "base_rent_index": 7.8, "base_buyer_index": 8.2},
    "D04": {"name": "Harbourfront / Telok Blangah", "coords": [1.2642, 103.8090], "base_price": 1950, "base_rent_index": 7.2, "base_buyer_index": 6.8},
    "D05": {"name": "West Coast / Clementi", "coords": [1.3148, 103.7652], "base_price": 1600, "base_rent_index": 6.8, "base_buyer_index": 7.0},
    "D06": {"name": "City Hall / Clarke Quay", "coords": [1.2929, 103.8526], "base_price": 2400, "base_rent_index": 8.8, "base_buyer_index": 6.2},
    "D07": {"name": "Bugis / Beach Road", "coords": [1.3001, 103.8580], "base_price": 2050, "base_rent_index": 8.2, "base_buyer_index": 7.4},
    "D08": {"name": "Little India / Farrer Park", "coords": [1.3129, 103.8539], "base_price": 1700, "base_rent_index": 7.0, "base_buyer_index": 7.1},
    "D09": {"name": "Orchard / River Valley", "coords": [1.3039, 103.8320], "base_price": 2600, "base_rent_index": 9.2, "base_buyer_index": 8.0},
    "D10": {"name": "Tanglin / Bukit Timah / Holland", "coords": [1.3104, 103.7949], "base_price": 2500, "base_rent_index": 8.9, "base_buyer_index": 8.3},
    "D11": {"name": "Newton / Novena", "coords": [1.3204, 103.8439], "base_price": 2200, "base_rent_index": 8.4, "base_buyer_index": 7.9},
    "D12": {"name": "Toa Payoh / Balestier", "coords": [1.3283, 103.8475], "base_price": 1550, "base_rent_index": 6.5, "base_buyer_index": 7.2},
    "D13": {"name": "MacPherson / Braddell", "coords": [1.3347, 103.8690], "base_price": 1500, "base_rent_index": 6.3, "base_buyer_index": 6.9},
    "D14": {"name": "Geylang / Eunos / Paya Lebar", "coords": [1.3182, 103.8920], "base_price": 1450, "base_rent_index": 6.7, "base_buyer_index": 7.5},
    "D15": {"name": "East Coast / Marine Parade", "coords": [1.3040, 103.9020], "base_price": 1800, "base_rent_index": 7.5, "base_buyer_index": 8.5},
    "D16": {"name": "Bedok / Upper East Coast", "coords": [1.3236, 103.9273], "base_price": 1500, "base_rent_index": 6.4, "base_buyer_index": 7.6},
    "D17": {"name": "Changi / Loyang / Pasir Ris", "coords": [1.3506, 103.9749], "base_price": 1350, "base_rent_index": 5.8, "base_buyer_index": 6.5},
    "D18": {"name": "Tampines / Pasir Ris", "coords": [1.3524, 103.9442], "base_price": 1400, "base_rent_index": 6.0, "base_buyer_index": 8.1},
    "D19": {"name": "Sengkang / Punggol / Hougang", "coords": [1.3858, 103.8924], "base_price": 1500, "base_rent_index": 6.9, "base_buyer_index": 9.0},
    "D20": {"name": "Bishan / Ang Mo Kio", "coords": [1.3612, 103.8378], "base_price": 1650, "base_rent_index": 7.1, "base_buyer_index": 8.0},
    "D21": {"name": "Upper Bukit Timah / Ulu Pandan", "coords": [1.3329, 103.7747], "base_price": 1800, "base_rent_index": 7.3, "base_buyer_index": 7.8},
    "D22": {"name": "Jurong / Boon Lay / Tuas", "coords": [1.3242, 103.7114], "base_price": 1300, "base_rent_index": 5.9, "base_buyer_index": 7.7},
    "D23": {"name": "Hillview / Choa Chu Kang", "coords": [1.3759, 103.7548], "base_price": 1350, "base_rent_index": 5.7, "base_buyer_index": 7.3},
    "D24": {"name": "Lim Chu Kang / Tengah", "coords": [1.4168, 103.7011], "base_price": 1100, "base_rent_index": 4.5, "base_buyer_index": 5.2},
    "D25": {"name": "Woodlands / Admiralty", "coords": [1.4360, 103.7865], "base_price": 1250, "base_rent_index": 5.2, "base_buyer_index": 6.8},
    "D26": {"name": "Mandai / Yishun", "coords": [1.4011, 103.8099], "base_price": 1300, "base_rent_index": 5.4, "base_buyer_index": 6.9},
    "D27": {"name": "Sembawang / Yishun", "coords": [1.4282, 103.8336], "base_price": 1280, "base_rent_index": 5.3, "base_buyer_index": 7.0},
    "D28": {"name": "Seletar / Yio Chu Kang", "coords": [1.3881, 103.8715], "base_price": 1400, "base_rent_index": 6.1, "base_buyer_index": 7.1}
}

MONTH_TRENDS = [
    {"month": "2025-11", "multiplier": 0.970, "volume_multiplier": 0.9},
    {"month": "2025-12", "multiplier": 0.975, "volume_multiplier": 0.8},
    {"month": "2026-01", "multiplier": 0.985, "volume_multiplier": 1.1},
    {"month": "2026-02", "multiplier": 0.980, "volume_multiplier": 1.0},
    {"month": "2026-03", "multiplier": 0.990, "volume_multiplier": 1.2},
    {"month": "2026-04", "multiplier": 0.995, "volume_multiplier": 1.3},
    {"month": "2026-05", "multiplier": 1.000, "volume_multiplier": 1.4}
]

# Valid metric keys that can be used for top-N queries
VALID_METRICS = {"demand_index", "rental_pressure", "buyer_activity", "avg_price_psf", "price_movement_percent"}


def parse_contract_date(contract_date: str) -> str:
    """Convert URA contractDate (e.g. '1225') to 'YYYY-MM' (e.g. '2025-12')"""
    if not contract_date or len(contract_date) != 4:
        return "2026-01"
    mm = contract_date[:2]
    yy = contract_date[2:]
    return f"20{yy}-{mm}"

def calculate_demand_index(buyer_activity: float, rental_pressure: float, price_movement_percent: float) -> float:
    """
    Weighted calculation of Demand Index on a 1.0 to 10.0 scale:
    - 40% Buyer Activity
    - 30% Rental Pressure
    - 30% Price Movement (normalized)
    """
    # Normalize price movement: e.g. +2% price change gives high score, -2% gives low score
    price_score = max(1.0, min(10.0, 5.0 + price_movement_percent * 2.0))
    score = (0.4 * buyer_activity) + (0.3 * rental_pressure) + (0.3 * price_score)
    return round(max(1.0, min(10.0, score)), 1)

def recalculate_district_analytics(db: Session) -> Dict[str, Any]:
    """
    Recalculates or seeds the district_monthly_stats table by aggregating transactions
    from the database, and falling back to deterministic baselines for missing data.
    """
    # 1. Clear existing statistics to avoid duplicates
    db.query(DistrictMonthlyStats).delete()
    db.commit()

    # 2. Query all transactions and projects to perform aggregation
    # Using python-side aggregation as SQLite might not support direct custom functions
    transactions = db.query(PropertyTransaction).all()
    projects = {p.id: p for p in db.query(PropertyProject).all()}
    
    # Structure to hold raw database aggregations: {(district, month): [psf_values]}
    db_aggregations = {}
    for tx in transactions:
        project = projects.get(tx.project_id)
        if not project:
            continue
        
        district = project.district
        # Normalize district to DXX format
        if district and not district.startswith("D"):
            district = f"D{district.zfill(2)}"
            
        month = parse_contract_date(tx.contract_date)
        
        key = (district, month)
        if key not in db_aggregations:
            db_aggregations[key] = []
        db_aggregations[key].append(tx.psf)

    # 3. For each district and month, calculate metrics
    # To ensure stable month-over-month calculation, we process month by month
    stats_created = 0
    
    for district, dist_info in DISTRICTS_INFO.items():
        previous_avg_psf = None
        
        for i, trend in enumerate(MONTH_TRENDS):
            month = trend["month"]
            mult = trend["multiplier"]
            vol_mult = trend["volume_multiplier"]
            
            # Check if database has actual transactions for this district & month
            db_key = (district, month)
            db_psfs = db_aggregations.get(db_key, [])
            
            avg_price_psf = None
            transaction_count = len(db_psfs)
            
            if transaction_count > 0:
                avg_price_psf = sum(db_psfs) / transaction_count
            else:
                # Deterministic fallback baseline with a tiny bit of random variation
                # We use a fixed seed per district-month so it is deterministic across runs
                seed_value = sum(ord(c) for c in district) + int(month.replace("-", ""))
                random.seed(seed_value)
                variation = random.uniform(-0.015, 0.015)
                avg_price_psf = dist_info["base_price"] * (mult + variation)
                # Seed transactional volume slightly
                transaction_count = int(max(1, round(random.randint(5, 25) * vol_mult)))

            # Calculate Price Movement % compared to previous month
            if previous_avg_psf is not None:
                price_movement_percent = ((avg_price_psf - previous_avg_psf) / previous_avg_psf) * 100
            else:
                # First month has a baseline change relative to multiplier trend
                price_movement_percent = (mult - MONTH_TRENDS[max(0, i-1)]["multiplier"]) * 100
            
            # Calculate Rental Pressure (1-10)
            seed_value = sum(ord(c) for c in district) * 2 + int(month.replace("-", ""))
            random.seed(seed_value)
            rental_noise = random.uniform(-0.4, 0.4)
            rental_pressure = max(1.0, min(10.0, dist_info["base_rent_index"] * mult + rental_noise))
            
            # Calculate Buyer Activity (1-10)
            buyer_noise = random.uniform(-0.3, 0.3)
            buyer_activity = max(1.0, min(10.0, dist_info["base_buyer_index"] * mult + (transaction_count / 15.0) + buyer_noise))
            
            # Calculate final Demand Index
            demand_index = calculate_demand_index(buyer_activity, rental_pressure, price_movement_percent)
            
            # Save stats
            stat_record = DistrictMonthlyStats(
                district=district,
                month=month,
                avg_price_psf=round(avg_price_psf, 2),
                price_movement_percent=round(price_movement_percent, 2),
                rental_pressure=round(rental_pressure, 1),
                buyer_activity=round(buyer_activity, 1),
                demand_index=demand_index,
                transaction_count=transaction_count
            )
            db.add(stat_record)
            stats_created += 1
            
            # Save for next month's comparison
            previous_avg_psf = avg_price_psf

    db.commit()
    return {"status": "Success", "records_created": stats_created}

def get_latest_district_stats(db: Session) -> List[Dict[str, Any]]:
    """
    Get the latest month's aggregated statistics for all districts.
    """
    # Get the latest month present in the stats
    latest_month_record = db.query(DistrictMonthlyStats.month).order_by(DistrictMonthlyStats.month.desc()).first()
    if not latest_month_record:
        # If empty, recalculate/seed first
        recalculate_district_analytics(db)
        latest_month_record = db.query(DistrictMonthlyStats.month).order_by(DistrictMonthlyStats.month.desc()).first()
        
    latest_month = latest_month_record[0] if latest_month_record else "2026-05"
    
    stats = db.query(DistrictMonthlyStats).filter(DistrictMonthlyStats.month == latest_month).all()
    
    results = []
    for stat in stats:
        dist_info = DISTRICTS_INFO.get(stat.district, {"name": "Unknown District", "coords": [1.3521, 103.8198]})
        results.append({
            "district": stat.district,
            "name": dist_info["name"],
            "coords": dist_info["coords"],
            "month": stat.month,
            "avg_price_psf": stat.avg_price_psf,
            "price_movement_percent": stat.price_movement_percent,
            "rental_pressure": stat.rental_pressure,
            "buyer_activity": stat.buyer_activity,
            "demand_index": stat.demand_index,
            "transaction_count": stat.transaction_count
        })
        
    # Sort by demand index descending
    results.sort(key=lambda x: x["demand_index"], reverse=True)
    return results

def get_district_trends(db: Session, district: str) -> Optional[List[Dict[str, Any]]]:
    """
    Get historical trend stats for a specific district.
    Returns None if the district code is not recognized (causes a 404 upstream).
    """
    # Normalize district
    normalized_district = district.strip().upper()
    if not normalized_district.startswith("D"):
        normalized_district = f"D{normalized_district.zfill(2)}"

    # Guard: reject unknown district codes before DB queries
    if normalized_district not in DISTRICTS_INFO:
        return None
        
    stats = db.query(DistrictMonthlyStats).filter(
        DistrictMonthlyStats.district == normalized_district
    ).order_by(DistrictMonthlyStats.month.asc()).all()
    
    # If empty, try seeding/recalculating first
    if not stats:
        recalculate_district_analytics(db)
        stats = db.query(DistrictMonthlyStats).filter(
            DistrictMonthlyStats.district == normalized_district
        ).order_by(DistrictMonthlyStats.month.asc()).all()
        
    results = []
    for stat in stats:
        results.append({
            "month": stat.month,
            "avg_price_psf": stat.avg_price_psf,
            "price_movement_percent": stat.price_movement_percent,
            "rental_pressure": stat.rental_pressure,
            "buyer_activity": stat.buyer_activity,
            "demand_index": stat.demand_index,
            "transaction_count": stat.transaction_count
        })
    return results

def get_district_summary(db: Session, district: str) -> Optional[Dict[str, Any]]:
    """
    Get a full summary for a single district: latest stats + all trend history.
    Returns None if the district is not recognized.
    """
    normalized_district = district.strip().upper()
    if not normalized_district.startswith("D"):
        normalized_district = f"D{normalized_district.zfill(2)}"

    if normalized_district not in DISTRICTS_INFO:
        return None

    dist_info = DISTRICTS_INFO[normalized_district]

    # Get latest stat for this district
    latest_stat = (
        db.query(DistrictMonthlyStats)
        .filter(DistrictMonthlyStats.district == normalized_district)
        .order_by(DistrictMonthlyStats.month.desc())
        .first()
    )

    if not latest_stat:
        recalculate_district_analytics(db)
        latest_stat = (
            db.query(DistrictMonthlyStats)
            .filter(DistrictMonthlyStats.district == normalized_district)
            .order_by(DistrictMonthlyStats.month.desc())
            .first()
        )

    if not latest_stat:
        return None

    # Get all trends
    trends = get_district_trends(db, normalized_district) or []

    return {
        "district": normalized_district,
        "name": dist_info["name"],
        "coords": dist_info["coords"],
        "month": latest_stat.month,
        "avg_price_psf": latest_stat.avg_price_psf,
        "price_movement_percent": latest_stat.price_movement_percent,
        "rental_pressure": latest_stat.rental_pressure,
        "buyer_activity": latest_stat.buyer_activity,
        "demand_index": latest_stat.demand_index,
        "transaction_count": latest_stat.transaction_count,
        "trends": trends,
    }

def get_top_districts_by_metric(db: Session, metric: str, n: int = 5) -> List[Dict[str, Any]]:
    """
    Return the top N districts ranked by a specific metric (descending).
    Valid metrics: demand_index, rental_pressure, buyer_activity, avg_price_psf, price_movement_percent
    """
    if metric not in VALID_METRICS:
        return []

    # Get all latest district stats and sort by the requested metric
    all_stats = get_latest_district_stats(db)
    sorted_stats = sorted(all_stats, key=lambda x: x.get(metric, 0), reverse=True)
    return sorted_stats[:n]
