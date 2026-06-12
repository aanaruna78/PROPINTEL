import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from app.models.property import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(50), primary_key=True, index=True)  # Slug format: 'era', 'propnex', Huttons'
    name = Column(String(255), nullable=False)
    domain = Column(String(255), unique=True, index=True, nullable=True)
    logo_url = Column(String(1000), nullable=True)
    primary_color = Column(String(10), default="#4338ca", nullable=False)  # Hex code for custom branding
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)
