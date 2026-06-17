"""
pulse_service.py — Market Pulse & Opportunity Alert Engine
Derives live market signals and role-filtered opportunity alerts from DistrictMonthlyStats.
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.services.district_service import get_latest_district_stats

# ─── Role → Alert Types mapping ────────────────────────────────────────────────
# Each role only sees alerts relevant to their market intent.
ROLE_ALERT_TYPES: Dict[str, List[str]] = {
    "buyer":           ["price_dip", "hot_streak", "cooling_warning"],
    "seller":          ["hot_streak", "high_demand"],
    "investor":        ["price_dip", "hot_streak", "rental_surge", "cooling_warning"],
    "landlord":        ["rental_surge", "high_demand", "cooling_warning"],
    "agency_manager":  ["price_dip", "hot_streak", "rental_surge", "cooling_warning", "high_demand"],
    "admin":           ["price_dip", "hot_streak", "rental_surge", "cooling_warning", "high_demand"],
    "tenant":          ["rental_surge"],
}

SEVERITY_ORDER = {"high": 0, "medium": 1, "low": 2}


# ─── Market Pulse ───────────────────────────────────────────────────────────────

def get_market_pulse(db: Session) -> Dict[str, Any]:
    """
    Returns a market-wide summary derived from the latest DistrictMonthlyStats.
    Includes URA index proxy, rental yield, momentum, and top mover.
    """
    stats = get_latest_district_stats(db)
    if not stats:
        return {}

    rising  = [d for d in stats if d["price_movement_percent"] > 0]
    cooling = [d for d in stats if d["price_movement_percent"] < 0]
    stable  = [d for d in stats if d["price_movement_percent"] == 0]

    avg_movement = sum(d["price_movement_percent"] for d in stats) / len(stats)

    # URA Property Price Index proxy — baseline 180.4 adjusted by avg movement
    ura_index = round(180.4 * (1 + avg_movement / 100), 1)
    ura_change = round(avg_movement, 2)

    # Rental yield proxy — maps rental_pressure 1-10 → 2%-5% yield
    avg_rental_pressure = sum(d["rental_pressure"] for d in stats) / len(stats)
    avg_rental_yield = round(2.0 + (avg_rental_pressure / 10.0) * 3.0, 1)

    # Yield change sign derived from movement direction
    avg_buyer_activity = sum(d["buyer_activity"] for d in stats) / len(stats)
    rental_yield_change = round((avg_buyer_activity - 7.0) * 0.05, 2)  # subtle signal

    # Top mover: highest absolute price movement (positive preferred)
    top_mover = max(stats, key=lambda x: x["price_movement_percent"])

    # Market momentum
    net = len(rising) - len(cooling)
    if net > 5:
        momentum = "bullish"
    elif net < -5:
        momentum = "bearish"
    else:
        momentum = "neutral"

    return {
        "ura_property_index": ura_index,
        "ura_index_change": ura_change,
        "avg_rental_yield": avg_rental_yield,
        "rental_yield_change": rental_yield_change,
        "rising_count": len(rising),
        "cooling_count": len(cooling),
        "stable_count": len(stable),
        "total_districts": len(stats),
        "top_mover": {
            "district": top_mover["district"],
            "name": top_mover["name"].split(" / ")[0],
            "price_movement_percent": top_mover["price_movement_percent"],
            "demand_index": top_mover["demand_index"],
        },
        "market_momentum": momentum,
    }


# ─── Opportunity Alerts ─────────────────────────────────────────────────────────

def get_opportunity_alerts(db: Session, role: str) -> List[Dict[str, Any]]:
    """
    Scans latest district stats and generates up to 5 opportunity alerts
    filtered by the requesting user's role.
    """
    stats = get_latest_district_stats(db)
    if not stats:
        return []

    allowed = set(ROLE_ALERT_TYPES.get(role, ["hot_streak"]))
    alerts: List[Dict[str, Any]] = []

    for d in stats:
        # ── Price Dip: below-trend price but strong underlying demand ──────────
        if "price_dip" in allowed:
            if d["price_movement_percent"] < -0.5 and d["demand_index"] >= 7.0:
                alerts.append({
                    "type": "price_dip",
                    "district": d["district"],
                    "district_name": d["name"].split(" / ")[0],
                    "severity": "high" if d["demand_index"] >= 8.0 else "medium",
                    "message": _price_dip_message(d, role),
                    "metric": d["price_movement_percent"],
                })

        # ── Hot Streak: elevated demand + high buyer activity ─────────────────
        if "hot_streak" in allowed:
            if d["demand_index"] >= 8.5 and d["buyer_activity"] >= 8.0:
                alerts.append({
                    "type": "hot_streak",
                    "district": d["district"],
                    "district_name": d["name"].split(" / ")[0],
                    "severity": "high",
                    "message": _hot_streak_message(d, role),
                    "metric": d["demand_index"],
                })

        # ── Rental Surge: very high rental pressure ───────────────────────────
        if "rental_surge" in allowed:
            if d["rental_pressure"] >= 8.5:
                alerts.append({
                    "type": "rental_surge",
                    "district": d["district"],
                    "district_name": d["name"].split(" / ")[0],
                    "severity": "high" if d["rental_pressure"] >= 9.0 else "medium",
                    "message": _rental_surge_message(d, role),
                    "metric": d["rental_pressure"],
                })

        # ── Cooling Warning: price drop + weak demand ─────────────────────────
        if "cooling_warning" in allowed:
            if d["price_movement_percent"] < -1.0 and d["demand_index"] < 6.0:
                alerts.append({
                    "type": "cooling_warning",
                    "district": d["district"],
                    "district_name": d["name"].split(" / ")[0],
                    "severity": "medium",
                    "message": _cooling_message(d, role),
                    "metric": d["price_movement_percent"],
                })

        # ── High Demand: peak buyer activity, ideal for sellers/landlords ─────
        if "high_demand" in allowed:
            if d["buyer_activity"] >= 8.5 and d["demand_index"] >= 8.0:
                alerts.append({
                    "type": "high_demand",
                    "district": d["district"],
                    "district_name": d["name"].split(" / ")[0],
                    "severity": "medium",
                    "message": _high_demand_message(d, role),
                    "metric": d["demand_index"],
                })

    # Sort by severity, then by metric magnitude
    alerts.sort(key=lambda x: (SEVERITY_ORDER.get(x["severity"], 2), -abs(x["metric"])))

    # Deduplicate same district + type
    seen: set = set()
    unique: List[Dict[str, Any]] = []
    for alert in alerts:
        key = (alert["district"], alert["type"])
        if key not in seen:
            seen.add(key)
            unique.append(alert)

    return unique[:5]


# ─── Role-Tailored Message Builders ────────────────────────────────────────────

def _price_dip_message(d: Dict, role: str) -> str:
    pct = abs(d["price_movement_percent"])
    dist, name = d["district"], d["name"].split(" / ")[0]
    if role == "buyer":
        return (f"{dist} ({name}) prices dipped {pct:.1f}% this month despite a Demand Index of "
                f"{d['demand_index']}/10 — a potential entry window before the next uptick.")
    elif role == "investor":
        return (f"{dist} shows a {pct:.1f}% price correction with sustained demand "
                f"({d['demand_index']}/10 DI) — classic counter-cyclical accumulation opportunity.")
    return f"{dist} ({name}) prices are down {pct:.1f}% MoM with strong underlying demand signals."


def _hot_streak_message(d: Dict, role: str) -> str:
    dist, name = d["district"], d["name"].split(" / ")[0]
    if role == "buyer":
        return (f"{dist} ({name}) is running hot — DI {d['demand_index']}/10 with Buyer Activity "
                f"{d['buyer_activity']}/10. Act quickly to avoid being priced out.")
    elif role == "seller":
        return (f"Strong buyer competition in {dist} ({name}). DI {d['demand_index']}/10 — prime "
                f"conditions to list and achieve above-asking offers.")
    elif role == "investor":
        return (f"{dist} is in a demand surge cycle. DI {d['demand_index']}/10, Activity "
                f"{d['buyer_activity']}/10 — momentum positioning opportunity.")
    return f"{dist} ({name}) demand surging — DI {d['demand_index']}/10, Activity {d['buyer_activity']}/10."


def _rental_surge_message(d: Dict, role: str) -> str:
    dist, name = d["district"], d["name"].split(" / ")[0]
    pressure = d["rental_pressure"]
    if role == "landlord":
        return (f"Rental Pressure in {dist} ({name}) hit {pressure}/10 — a strong signal to "
                f"review lease rates upward at next renewal.")
    elif role == "investor":
        return (f"{dist} Rental Pressure at {pressure}/10 indicates strong yield potential. "
                f"Consider buy-to-let positioning in this district.")
    elif role == "tenant":
        return (f"Rental competition in {dist} ({name}) is very high ({pressure}/10). "
                f"Act fast on listings — units are being snapped up quickly.")
    return f"{dist} Rental Pressure surging at {pressure}/10 — strong occupancy signals across the district."


def _cooling_message(d: Dict, role: str) -> str:
    dist, name = d["district"], d["name"].split(" / ")[0]
    pct = abs(d["price_movement_percent"])
    if role == "buyer":
        return (f"{dist} ({name}) is cooling — prices down {pct:.1f}% with DI at "
                f"{d['demand_index']}/10. A patient buyer's market may be forming.")
    elif role == "investor":
        return (f"{dist} entering a cooling phase (−{pct:.1f}% MoM, DI {d['demand_index']}/10). "
                f"Monitor for counter-cyclical entry over the next 2–3 months.")
    elif role == "landlord":
        return (f"Demand softening in {dist} ({name}). Consider locking in tenants now "
                f"before market conditions deteriorate further.")
    return f"{dist} ({name}) market is cooling — prices down {pct:.1f}% MoM."


def _high_demand_message(d: Dict, role: str) -> str:
    dist, name = d["district"], d["name"].split(" / ")[0]
    if role == "seller":
        return (f"Buyer competition peaked in {dist} ({name}) — Activity {d['buyer_activity']}/10. "
                f"Optimal time to list for maximum price discovery.")
    elif role == "landlord":
        return (f"High buyer activity ({d['buyer_activity']}/10) in {dist} ({name}) reflects "
                f"strong housing demand — your units should attract quality tenants quickly.")
    return f"{dist} ({name}) showing peak demand — Activity {d['buyer_activity']}/10, DI {d['demand_index']}/10."
