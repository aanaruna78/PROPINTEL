from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import declarative_base

Base = declarative_base()

# geoalchemy2 is an optional dependency for PostGIS support.
# When not installed, the Geometry column is replaced with a plain String column
# so the app can still start in offline/mock mode without PostGIS.
try:
    from geoalchemy2 import Geometry
    _use_geometry = True
except ImportError:
    print("WARNING: geoalchemy2 not installed — location column will use String fallback (offline/mock mode).")
    _use_geometry = False

class PropertyProject(Base):
    __tablename__ = "property_projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    project_type = Column(String(50), nullable=False) # 'Condo' or 'HDB'
    district = Column(String(10), index=True, nullable=False)
    tenure = Column(String(100))
    completion_year = Column(Integer)
    
    # Specific fields
    developer = Column(String(255), nullable=True)
    total_units = Column(Integer, nullable=True)
    block_number = Column(String(50), nullable=True) # Used for HDB blocks
    
    # PostGIS Point (Longitude, Latitude) with standard SRID 4326
    # Falls back to a String column if geoalchemy2 is not installed
    location = (
        Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)
        if _use_geometry
        else Column(String(100), nullable=True)
    )
    
    # Derived Intelligence (To be updated by worker processes)
    fair_value_psf = Column(Float, nullable=True)
    rental_yield_estimate = Column(Float, nullable=True)
