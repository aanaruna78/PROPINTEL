import os
from datetime import datetime, timedelta
from typing import Optional, Any
from jose import jwt
from passlib.context import CryptContext

# SECRET_KEY for JWT signature
SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_propintel_key_123_abc_xyz")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days for local development convenience

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Match the 72-byte truncation applied during hashing
    return pwd_context.verify(plain_password[:72], hashed_password)

def get_password_hash(password: str) -> str:
    # bcrypt has a hard 72-byte limit; truncate to stay within it
    return pwd_context.hash(password[:72])

# In-memory blocklist of revoked tokens
REVOKED_TOKENS = set()

def is_token_revoked(token: str) -> bool:
    return token in REVOKED_TOKENS

import uuid

def create_access_token(subject: str | Any, role: str, tenant_id: Optional[str] = "propintel", expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Short-lived access token for security (e.g. 15 minutes)
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "tenant_id": tenant_id,
        "type": "access",
        "jti": str(uuid.uuid4())
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: str | Any, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Long-lived refresh token (e.g. 7 days)
        expire = datetime.utcnow() + timedelta(days=7)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "jti": str(uuid.uuid4())
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
