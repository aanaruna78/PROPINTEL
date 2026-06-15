import datetime
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM, is_token_revoked
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.user import TokenData

# OAuth2 Scheme to retrieve bearer token
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False
)

# In-memory mock database for fallback registration support during local development
MOCK_USERS_DB = {
    "buyer@propintel.ai": {
        "email": "buyer@propintel.ai",
        "password": "password123",
        "full_name": "Aiden Buyer",
        "role": "buyer",
        "tenant_id": "propintel",
        "mobile_number": "+65 9111 2222"
    },
    "seller@propintel.ai": {
        "email": "seller@propintel.ai",
        "password": "password123",
        "full_name": "Sarah Seller",
        "role": "seller",
        "tenant_id": "propintel",
        "mobile_number": "+65 9222 3333"
    },
    "tenant@propintel.ai": {
        "email": "tenant@propintel.ai",
        "password": "password123",
        "full_name": "Toby Tenant",
        "role": "tenant",
        "tenant_id": "propintel",
        "mobile_number": "+65 9333 4444"
    },
    "investor@propintel.ai": {
        "email": "investor@propintel.ai",
        "password": "password123",
        "full_name": "Ian Investor",
        "role": "investor",
        "tenant_id": "propintel",
        "mobile_number": "+65 9444 5555"
    },
    "landlord@propintel.ai": {
        "email": "landlord@propintel.ai",
        "password": "password123",
        "full_name": "Lucas Landlord",
        "role": "landlord",
        "tenant_id": "propintel",
        "mobile_number": "+65 9555 6666"
    },
    "manager@propintel.ai": {
        "email": "manager@propintel.ai",
        "password": "password123",
        "full_name": "Marcus Manager",
        "role": "agency_manager",
        "tenant_id": "propintel",
        "mobile_number": "+65 9666 7777"
    },
    "admin@propintel.ai": {
        "email": "admin@propintel.ai",
        "password": "password123",
        "full_name": "Alice Admin",
        "role": "admin",
        "tenant_id": "propintel",
        "mobile_number": "+65 9777 8888"
    },
    "user.buyer@gmail.com": {
        "email": "user.buyer@gmail.com",
        "password": "password123",
        "full_name": "Gmail Buyer",
        "role": "buyer",
        "tenant_id": "propintel",
        "mobile_number": "+65 8111 2222"
    },
    "user.seller@gmail.com": {
        "email": "user.seller@gmail.com",
        "password": "password123",
        "full_name": "Gmail Seller",
        "role": "seller",
        "tenant_id": "propintel",
        "mobile_number": "+65 8222 3333"
    }
}

# Mock user for local development database-free testing fallback
MOCK_USER_DICT = {
    "id": 1,
    "email": "dev@propintel.ai",
    "full_name": "Developer User",
    "role": "admin",
    "is_active": True,
    "mobile_number": "+65 9123 4567",
    "tenant_id": "propintel",
    "created_at": datetime.datetime.utcnow(),
    "updated_at": datetime.datetime.utcnow()
}

# Mock tenant fallback configuration
MOCK_TENANT_DICT = {
    "id": "propintel",
    "name": "PropIntel Default",
    "domain": "localhost",
    "logo_url": None,
    "primary_color": "#4338ca",
    "is_active": True,
    "created_at": datetime.datetime.utcnow(),
    "updated_at": datetime.datetime.utcnow()
}

def get_current_tenant(
    db: Session = Depends(get_db),
    x_tenant_id: str | None = Header(None, alias="X-Tenant-ID")
) -> Tenant:
    tenant_id = x_tenant_id or "propintel"
    
    try:
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if tenant:
            return tenant
    except Exception as db_err:
        print(f"Database query failed, checking mock tenant: {db_err}")
        
    # Mock fallback for development ease
    mock_tenant_data = dict(MOCK_TENANT_DICT)
    mock_tenant_data["id"] = tenant_id
    mock_tenant_data["name"] = f"{tenant_id.replace('-', ' ').title()} Agency"
    return Tenant(**mock_tenant_data)

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    # If no token is provided or if the token is blacklisted, raise 401
    if not token or is_token_revoked(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token_data = TokenData(email=email, role=role)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Attempt to query database
    try:
        user = db.query(User).filter(User.email == token_data.email).first()
        if user:
            return user
    except Exception as db_err:
        print(f"Database query failed, checking mock credentials: {db_err}")
        
    # Mock fallback to allow offline developer testing
    mock_user_data = dict(MOCK_USER_DICT)
    mock_user_data["email"] = token_data.email
    if token_data.role:
        mock_user_data["role"] = token_data.role
    
    # Assign tenant_id from token if present
    mock_user_data["tenant_id"] = payload.get("tenant_id", "propintel")
    
    # If the user exists in our in-memory mock registered database, use their stored name and mobile number
    if token_data.email in MOCK_USERS_DB:
        mock_user_data["full_name"] = MOCK_USERS_DB[token_data.email].get("full_name", mock_user_data["full_name"])
        mock_user_data["mobile_number"] = MOCK_USERS_DB[token_data.email].get("mobile_number", mock_user_data["mobile_number"])
    # Dynamically derive full name from email (e.g., john.agent@propintel.ai -> John Agent)
    elif "@" in token_data.email and token_data.email != MOCK_USER_DICT["email"]:
        email_prefix = token_data.email.split("@")[0]
        name_parts = email_prefix.replace("-", ".").replace("_", ".").split(".")
        mock_user_data["full_name"] = " ".join([part.capitalize() for part in name_parts])
        
    mock_user = User(**mock_user_data)
    return mock_user


class AllowedRoles:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Allowed roles: {', '.join(self.allowed_roles)}"
            )
        return current_user

