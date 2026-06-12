from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
import datetime

class TenantBase(BaseModel):
    name: str
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = "#4338ca"

class TenantCreate(TenantBase):
    id: str  # The unique slug/id (e.g. 'propnex')

class TenantResponse(TenantBase):
    id: str
    is_active: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class TenantBrandingUpdate(BaseModel):
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None

class TenantMemberInvite(BaseModel):
    email: EmailStr
    full_name: str
    role: Optional[str] = "agent"  # 'admin', 'agent'
