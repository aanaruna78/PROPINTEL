from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

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

    # Relationship to transactions
    transactions = relationship("PropertyTransaction", back_populates="project", cascade="all, delete-orphan")

class PropertyTransaction(Base):
    __tablename__ = "property_transactions"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("property_projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    contract_date = Column(String(10), nullable=False, index=True) # format: "MMYY" (e.g. "1225")
    price = Column(Float, nullable=False)
    area_sqm = Column(Float, nullable=False)
    area_sqft = Column(Float, nullable=False)
    psf = Column(Float, nullable=False, index=True)
    
    property_type = Column(String(100), nullable=False)
    tenure = Column(String(100), nullable=False)
    floor_range = Column(String(50), nullable=False)
    type_of_sale = Column(String(50), nullable=False) # 'New Sale', 'Resale', 'Sub Sale'
    no_of_units = Column(Integer, default=1)
    type_of_area = Column(String(50), nullable=False) # 'Strata', 'Land'
    nett_price = Column(Float, nullable=True)

    # Relationship to project
    project = relationship("PropertyProject", back_populates="transactions")

class DistrictMonthlyStats(Base):
    __tablename__ = "district_monthly_stats"

    id = Column(Integer, primary_key=True, index=True)
    district = Column(String(10), index=True, nullable=False)
    month = Column(String(7), index=True, nullable=False)  # format: "YYYY-MM"
    avg_price_psf = Column(Float, nullable=False)
    price_movement_percent = Column(Float, nullable=False)
    rental_pressure = Column(Float, nullable=False)
    buyer_activity = Column(Float, nullable=False)
    demand_index = Column(Float, nullable=False)
    transaction_count = Column(Integer, nullable=False)

