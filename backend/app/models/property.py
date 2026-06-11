from sqlalchemy import Column, Integer, String, Float
from geoalchemy2 import Geometry
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class PropertyProject(Base):
    __tablename__ = "property_projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    project_type = Column(String(50), nullable=False) # 'Condo' or 'HDB'
    district = Column(String(10), index=True, nullable=False)
    tenure = Column(String(100))
    completion_year = Column(Integer)
    
    # PostGIS Point (Longitude, Latitude) with standard SRID 4326
    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
    
    # Derived Intelligence (To be updated by worker processes)
    fair_value_psf = Column(Float, nullable=True)
    rental_yield_estimate = Column(Float, nullable=True)
