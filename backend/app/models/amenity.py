from sqlalchemy import Column, Integer, String
from app.models.property import Base

try:
    from geoalchemy2 import Geometry
    _use_geometry = True
except ImportError:
    _use_geometry = False

class Amenity(Base):
    __tablename__ = "amenities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False) # 'MRT', 'Primary School', 'Mall'
    
    # PostGIS Point (Longitude, Latitude) with standard SRID 4326
    location = (
        Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)
        if _use_geometry
        else Column(String(100), nullable=True)
    )
