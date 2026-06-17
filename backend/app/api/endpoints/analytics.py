from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.analytics import (
    DistrictStatsResponse, DistrictTrendResponse, DistrictSummaryResponse,
    MarketPulseResponse, OpportunityAlert, AISummaryResponse,
)
from app.services import district_service
from app.services.district_service import VALID_METRICS
from app.services import pulse_service
from app.services import ai_summary_service
import os

router = APIRouter()

@router.get("/districts", response_model=List[DistrictStatsResponse])
def get_latest_districts_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch the latest aggregated analytics metrics for all 28 Singapore districts.
    Sorted by Demand Index descending.
    """
    try:
        return district_service.get_latest_district_stats(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch district stats: {e}")

@router.get("/districts/top/{metric}", response_model=List[DistrictStatsResponse])
def get_top_districts(
    metric: str,
    n: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch the top N districts ranked by a specific metric.
    Valid metrics: demand_index, rental_pressure, buyer_activity, avg_price_psf, price_movement_percent
    """
    if metric not in VALID_METRICS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid metric '{metric}'. Valid options: {', '.join(sorted(VALID_METRICS))}"
        )
    try:
        return district_service.get_top_districts_by_metric(db, metric, n)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch top districts: {e}")

@router.get("/districts/{district}", response_model=DistrictSummaryResponse)
def get_district_summary(
    district: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch a full summary for a specific district (latest stats + all historical trends).
    E.g. /districts/D15 — returns D15's latest metrics and 7-month trend history.
    """
    try:
        summary = district_service.get_district_summary(db, district)
        if summary is None:
            raise HTTPException(
                status_code=404,
                detail=f"District {district.upper()} not found."
            )
        return summary
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch district summary: {e}")

@router.get("/districts/{district}/trends", response_model=List[DistrictTrendResponse])
def get_district_historical_trends(
    district: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch historical monthly trends for a specific district (e.g. D15).
    Returns 7 months of aggregated data.
    """
    try:
        trends = district_service.get_district_trends(db, district)
        if trends is None:
            raise HTTPException(
                status_code=404,
                detail=f"District {district.upper()} not found or no data available."
            )
        return trends
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch district trends: {e}")

@router.post("/districts/trigger-aggregation")
def trigger_aggregation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Trigger manual recalculation/aggregation of district statistics.
    Clears existing stats and re-seeds all 28 districts × 7 months.
    """
    try:
        result = district_service.recalculate_district_analytics(db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to aggregate stats: {e}")


@router.get("/market-pulse", response_model=MarketPulseResponse)
def get_market_pulse(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns a live market-wide pulse: URA index proxy, rental yield, momentum,
    rising/cooling district counts, and the top-moving district this month.
    Available to all authenticated users.
    """
    try:
        pulse = pulse_service.get_market_pulse(db)
        if not pulse:
            raise HTTPException(status_code=503, detail="Market pulse data not yet available.")
        return pulse
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute market pulse: {e}")


@router.get("/alerts", response_model=List[OpportunityAlert])
def get_opportunity_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns up to 5 opportunity alerts filtered by the requesting user's role.
    Each role sees only alerts relevant to their market intent.
    """
    try:
        alerts = pulse_service.get_opportunity_alerts(db, current_user.role)
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate alerts: {e}")


@router.get("/districts/{district}/ai-summary", response_model=AISummaryResponse)
def get_district_ai_summary(
    district: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a 2-3 sentence AI market summary for a specific district.
    Uses OpenAI gpt-4o-mini when OPENAI_API_KEY is set; falls back to
    a high-quality deterministic template in dev/offline mode.
    """
    try:
        summary_data = district_service.get_district_summary(db, district)
        if summary_data is None:
            raise HTTPException(
                status_code=404,
                detail=f"District {district.upper()} not found."
            )
        trends = summary_data.get("trends", [])
        summary_text = ai_summary_service.generate_district_summary(
            district=district.upper(),
            stats=summary_data,
            trends=trends,
        )
        powered_by = "openai/gpt-4o-mini" if os.getenv("OPENAI_API_KEY") else "template"
        return {
            "district": district.upper(),
            "summary": summary_text,
            "powered_by": powered_by,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate AI summary: {e}")
