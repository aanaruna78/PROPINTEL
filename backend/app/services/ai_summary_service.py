"""
ai_summary_service.py — AI District Summary Engine
Generates 2-3 sentence market summaries using OpenAI gpt-4o-mini.
Falls back to high-quality deterministic templates when no API key is present.
"""
import os
from typing import List, Dict, Any


def generate_district_summary(district: str, stats: Dict[str, Any], trends: List[Dict[str, Any]]) -> str:
    """
    Generate a human-readable AI summary for a district.
    Uses OpenAI gpt-4o-mini if OPENAI_API_KEY env var is set.
    Falls back to rich templated summary in dev/mock mode.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        return _openai_summary(api_key, district, stats, trends)
    return _templated_summary(district, stats, trends)


# ─── OpenAI Path ────────────────────────────────────────────────────────────────

def _openai_summary(api_key: str, district: str, stats: Dict, trends: List[Dict]) -> str:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)

        trend_context = ""
        if len(trends) >= 2:
            prev = trends[-2]
            curr = trends[-1]
            trend_context = (
                f"\nHistorical context (last 2 months): "
                f"Price moved from SGD {prev['avg_price_psf']:.0f} to SGD {curr['avg_price_psf']:.0f} PSF. "
                f"Demand Index moved from {prev['demand_index']} to {curr['demand_index']}."
            )

        prompt = (
            "You are a senior Singapore real estate analyst. Write exactly 2–3 concise, "
            "data-driven sentences summarising this district for a property buyer. "
            "Be specific, use the numbers, and end with one actionable takeaway. "
            "Do not use bullet points or headers.\n\n"
            f"District: {stats['district']} — {stats['name']}\n"
            f"Latest Month: {stats['month']}\n"
            f"Avg Price PSF: SGD {stats['avg_price_psf']:.0f}\n"
            f"Price Movement (MoM): {stats['price_movement_percent']:+.2f}%\n"
            f"Demand Index: {stats['demand_index']}/10\n"
            f"Rental Pressure: {stats['rental_pressure']}/10\n"
            f"Buyer Activity: {stats['buyer_activity']}/10\n"
            f"Transaction Count: {stats['transaction_count']}"
            f"{trend_context}\n\nSummary:"
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=180,
            temperature=0.65,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"[ai_summary_service] OpenAI call failed, using template fallback: {e}")
        return _templated_summary(district, stats, trends)


# ─── Template Path (dev / no API key) ──────────────────────────────────────────

def _templated_summary(district: str, stats: Dict, trends: List[Dict]) -> str:
    name        = stats.get("name", district)
    psf         = stats.get("avg_price_psf", 0)
    movement    = stats.get("price_movement_percent", 0)
    demand      = stats.get("demand_index", 5.0)
    rental      = stats.get("rental_pressure", 5.0)
    activity    = stats.get("buyer_activity", 5.0)
    tx_count    = stats.get("transaction_count", 0)
    first_name  = name.split(" / ")[0]

    # ── Sentence 1: price movement + context ───────────────────────────────────
    if movement > 1.5:
        s1 = (f"{district} ({first_name}) is on a strong upward run with prices up "
              f"+{movement:.1f}% month-on-month, averaging SGD {psf:,.0f} PSF across "
              f"{tx_count} recorded transactions.")
    elif movement > 0.2:
        s1 = (f"{district} ({first_name}) prices are edging higher at +{movement:.1f}% "
              f"month-on-month, with an average of SGD {psf:,.0f} PSF — "
              f"reflecting steady underlying demand.")
    elif movement < -1.5:
        s1 = (f"{district} ({first_name}) is in a correction phase, with prices easing "
              f"{abs(movement):.1f}% month-on-month to SGD {psf:,.0f} PSF across "
              f"{tx_count} transactions — a potential value window for patient buyers.")
    elif movement < -0.2:
        s1 = (f"{district} ({first_name}) has seen a modest softening of {abs(movement):.1f}% "
              f"month-on-month, with current average pricing at SGD {psf:,.0f} PSF.")
    else:
        s1 = (f"{district} ({first_name}) is holding steady at SGD {psf:,.0f} PSF, "
              f"with minimal price movement ({movement:+.1f}% MoM) across {tx_count} transactions "
              f"suggesting a balanced supply-demand dynamic.")

    # ── Sentence 2: demand + activity ──────────────────────────────────────────
    if demand >= 8.5:
        demand_desc, demand_action = "extremely hot", "expect intense competition and rapid deal closings"
    elif demand >= 7.0:
        demand_desc, demand_action = "healthy and active", "fundamentals support both end-users and investors"
    elif demand >= 5.5:
        demand_desc, demand_action = "moderate", "buyers have negotiating room in the current climate"
    else:
        demand_desc, demand_action = "subdued", "conditions favour patient buyers willing to wait for sellers to move"

    s2 = (f"Demand conditions are {demand_desc} (DI {demand}/10) with Buyer Activity at "
          f"{activity}/10 — {demand_action}.")

    # ── Sentence 3: rental note + takeaway ─────────────────────────────────────
    if rental >= 8.5:
        s3 = (f"Rental pressure is very high at {rental}/10, making this district particularly "
              f"attractive for buy-to-let investors seeking strong occupancy rates.")
    elif rental >= 7.0:
        s3 = (f"Rental pressure is solid at {rental}/10, supporting good occupancy and "
              f"making {district} a reliable choice for landlords.")
    elif rental >= 5.5:
        s3 = (f"Rental pressure is moderate at {rental}/10 — a fair environment for "
              f"both renters seeking choice and landlords looking for stable occupancy.")
    else:
        s3 = (f"Rental pressure is relatively low at {rental}/10, indicating a renter-friendly "
              f"environment and possible opportunity for landlords to position competitively.")

    return f"{s1} {s2} {s3}"
