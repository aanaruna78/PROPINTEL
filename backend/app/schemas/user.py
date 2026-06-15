from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Optional[str] = "buyer"  # 'buyer', 'seller', 'agent', 'admin'
    mobile_number: Optional[str] = None
    tenant_id: Optional[str] = "propintel"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class SessionResponse(BaseModel):
    session_id: str
    device: str
    channel: str
    ip_address: str
    last_active: datetime.datetime
    is_current: bool

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class OtpRequest(BaseModel):
    email_or_mobile: str

class OtpVerify(BaseModel):
    email_or_mobile: str
    code: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str
