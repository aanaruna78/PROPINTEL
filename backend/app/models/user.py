import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.property import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="buyer", nullable=False)  # 'buyer', 'seller', 'agent', 'admin'
    is_active = Column(Boolean, default=True, nullable=False)
    mobile_number = Column(String(50), nullable=True)
    
    tenant_id = Column(String(50), ForeignKey("tenants.id"), nullable=True)
    tenant = relationship("Tenant")
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)
