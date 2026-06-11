from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.property import PropertyResponse, PropertyWithAmenitiesResponse
from app.services import property_service

router = APIRouter()

@router.get("/", response_model=List[PropertyResponse])
def read_properties(skip: int = 0, limit: int = 50, district: str = None, db: Session = Depends(get_db)):
    """
    Retrieve a list of property projects (Condos and HDBs).
    """
    properties = property_service.get_properties(db, skip=skip, limit=limit, district=district)
    return properties

@router.get("/{property_id}", response_model=PropertyWithAmenitiesResponse)
def read_property_details(property_id: int, radius_meters: float = 1000.0, db: Session = Depends(get_db)):
    """
    Retrieve deep details for a specific property, including a spatial query 
    for nearby amenities (MRTs, Schools, etc.) within the given radius.
    """
    prop = property_service.get_property_with_amenities(db, property_id=property_id, radius_meters=radius_meters)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop
