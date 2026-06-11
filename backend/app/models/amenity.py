from sqlalchemy import Column, Integer, String
from geoalchemy2 import Geometry
from app.models.property import Base

class Amenity(Base):
    __tablename__ = "amenities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False) # 'MRT', 'Primary School', 'Mall'
    
    # PostGIS Point (Longitude, Latitude) with standard SRID 4326
    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
