from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.hdb import HdbMarketIntelligenceResponse
from app.services import hdb_service

router = APIRouter()

@router.get("/towns", response_model=List[str])
def get_hdb_towns():
    """
    Retrieve all supported Singapore HDB towns.
    """
    return hdb_service.get_hdb_towns()

@router.get("/flat-types", response_model=List[str])
def get_hdb_flat_types():
    """
    Retrieve all supported HDB flat sizes/types.
    """
    return hdb_service.get_hdb_flat_types()

@router.get("/market-intelligence", response_model=HdbMarketIntelligenceResponse)
def get_hdb_market_intelligence(
    town: str = Query("Tampines", description="Singapore HDB Town (e.g. Tampines, Punggol)"),
    flat_type: str = Query("4-Room", description="HDB flat type (e.g. 3-Room, 4-Room, 5-Room, Executive)"),
    db: Session = Depends(get_db)
):
    """
    Fetch comprehensive HDB Market Intelligence analytics for a selected town and flat type,
    including historical resale price trends, rental yield analysis, and liquidity scoring.
    """
    return hdb_service.get_market_intelligence(db, town=town, flat_type=flat_type)
