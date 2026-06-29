import sys
import os
import pytest

# Disable geoalchemy2 to force model fallback to standard String/VARCHAR columns for SQLite testing
sys.modules['geoalchemy2'] = None

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import models to ensure they register on Base
from app.models.property import Base
from app.models.user import User
from app.models.tenant import Tenant
from app.models.amenity import Amenity

# Setup SQLite in-memory engine with StaticPool to share connection across sessions
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    # Create the database tables
    Base.metadata.create_all(bind=engine)
    
    # Seed default tenants and users
    db_session = TestingSessionLocal()
    try:
        # Seed default tenants
        propintel_tenant = Tenant(
            id="propintel",
            name="PropIntel HQ",
            domain="propintel.ai",
            logo_url="https://propintel.ai/logo.png",
            primary_color="#4338ca",
            is_active=True
        )
        era_tenant = Tenant(
            id="era",
            name="ERA Singapore",
            domain="era.propintel.ai",
            logo_url="https://era.com.sg/logo.png",
            primary_color="#ff0000",
            is_active=True
        )
        db_session.add(propintel_tenant)
        db_session.add(era_tenant)
        db_session.commit()
        
        yield db_session
    finally:
        db_session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    from app.main import app
    from app.core.database import get_db

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    from fastapi.testclient import TestClient
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def auth_headers():
    """
    Mint a JWT access token directly (bypassing bcrypt registration) and
    return Authorization headers for use in protected endpoint tests.
    The mock user fallback in get_current_user handles unknown emails gracefully.
    """
    from datetime import timedelta
    from app.core.security import create_access_token
    token = create_access_token(
        subject="test_admin@propintel.ai",
        role="admin",
        tenant_id="propintel",
        expires_delta=timedelta(hours=1)
    )
    return {"Authorization": f"Bearer {token}"}
