from pydantic import BaseModel, ConfigDict
from typing import Optional

class AmenityBase(BaseModel):
    name: str
    category: str

class AmenityCreate(AmenityBase):
    longitude: float
    latitude: float

class AmenityResponse(AmenityBase):
    id: int
    longitude: float
    latitude: float
    distance_meters: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)
