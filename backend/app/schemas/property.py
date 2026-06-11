from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from app.schemas.amenity import AmenityResponse

class PropertyBase(BaseModel):
    name: str
    project_type: str
    district: str
    tenure: Optional[str] = None
    completion_year: Optional[int] = None
    developer: Optional[str] = None
    total_units: Optional[int] = None
    block_number: Optional[str] = None
    fair_value_psf: Optional[float] = None
    rental_yield_estimate: Optional[float] = None

class PropertyCreate(PropertyBase):
    longitude: float
    latitude: float

class PropertyResponse(PropertyBase):
    id: int
    longitude: float
    latitude: float
    
    model_config = ConfigDict(from_attributes=True)

class PropertyWithAmenitiesResponse(PropertyResponse):
    nearby_amenities: List[AmenityResponse] = []
