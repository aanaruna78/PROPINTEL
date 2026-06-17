from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class DistrictStatsResponse(BaseModel):
    district: str
    name: str
    coords: List[float]
    month: str
    avg_price_psf: float
    price_movement_percent: float
    rental_pressure: float
    buyer_activity: float
    demand_index: float
    transaction_count: int

    model_config = ConfigDict(from_attributes=True)

class DistrictTrendResponse(BaseModel):
    month: str
    avg_price_psf: float
    price_movement_percent: float
    rental_pressure: float
    buyer_activity: float
    demand_index: float
    transaction_count: int

    model_config = ConfigDict(from_attributes=True)

class DistrictSummaryResponse(BaseModel):
    """Full summary for a single district including latest stats and all historical trends."""
    district: str
    name: str
    coords: List[float]
    month: str
    avg_price_psf: float
    price_movement_percent: float
    rental_pressure: float
    buyer_activity: float
    demand_index: float
    transaction_count: int
    trends: List[DistrictTrendResponse]

    model_config = ConfigDict(from_attributes=True)


# ─── Market Pulse ───────────────────────────────────────────────────────────────

class TopMoverInfo(BaseModel):
    district: str
    name: str
    price_movement_percent: float
    demand_index: float

class MarketPulseResponse(BaseModel):
    ura_property_index: float
    ura_index_change: float
    avg_rental_yield: float
    rental_yield_change: float
    rising_count: int
    cooling_count: int
    stable_count: int
    total_districts: int
    top_mover: Optional[TopMoverInfo]
    market_momentum: str  # "bullish" | "neutral" | "bearish"

    model_config = ConfigDict(from_attributes=True)


# ─── Opportunity Alerts ─────────────────────────────────────────────────────────

class OpportunityAlert(BaseModel):
    type: str          # "price_dip" | "hot_streak" | "rental_surge" | "cooling_warning" | "high_demand"
    district: str
    district_name: str
    severity: str      # "high" | "medium" | "low"
    message: str
    metric: float

    model_config = ConfigDict(from_attributes=True)


# ─── AI Summary ─────────────────────────────────────────────────────────────────

class AISummaryResponse(BaseModel):
    district: str
    summary: str
    powered_by: str    # "openai/gpt-4o-mini" | "template"

    model_config = ConfigDict(from_attributes=True)
