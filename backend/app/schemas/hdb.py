from pydantic import BaseModel, Field
from typing import List

class HdbResaleTrendPoint(BaseModel):
    quarter: str = Field(..., description="Singapore HDB transaction quarter (e.g. 2025-Q3)")
    avg_price: float = Field(..., description="Average transaction resale price in SGD")
    avg_psf: float = Field(..., description="Average calculated price per square foot in SGD")
    volume: int = Field(..., description="Total volume of resale transactions during this quarter")

class HdbRentalAnalysis(BaseModel):
    avg_rent: float = Field(..., description="Average monthly HDB rental price in SGD")
    active_listings: int = Field(..., description="Number of active rental listings listed in town")
    rental_yield: float = Field(..., description="Estimated annual rental yield percentage (e.g. 5.4)")
    rental_pressure: float = Field(..., description="Rental pressure demand index from 0 to 10")

class HdbLiquidityScore(BaseModel):
    liquidity_score: float = Field(..., description="Overall liquidity speed score from 0 to 100")
    rating: str = Field(..., description="Liquidity tier rating (High, Moderate, Low)")
    avg_days_on_market: int = Field(..., description="Average days on market before unit sells")
    turnover_rate: float = Field(..., description="HDB flat turnover rate percentage (e.g. 1.8)")

class HdbMarketIntelligenceResponse(BaseModel):
    town: str = Field(..., description="Singapore HDB town (e.g. Tampines)")
    flat_type: str = Field(..., description="HDB flat type (e.g. 4-Room)")
    resale_trends: List[HdbResaleTrendPoint] = Field(..., description="Historical quarterly resale price trends")
    rental_analysis: HdbRentalAnalysis = Field(..., description="Rental yield and market rent indicators")
    liquidity: HdbLiquidityScore = Field(..., description="Flat transaction velocity and liquidity scoring")
