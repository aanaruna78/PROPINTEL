from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.database import engine
from app.models.property import Base
from app.models.user import User # Ensure SQLAlchemy registers the user table
from app.models.tenant import Tenant # Ensure SQLAlchemy registers the tenant table
from app.api.endpoints import properties, auth, tenant, rbac, ura, hdb, analytics, chat

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB, Redis, etc.
    print("Starting up PROPINTEL AI Backend...")
    # Initialize database tables (for dev purposes; normally use Alembic)
    try:
        Base.metadata.create_all(bind=engine)
        # Seed/recalculate district analytics on startup
        from app.core.database import SessionLocal
        from app.services.district_service import recalculate_district_analytics
        db = SessionLocal()
        if db is not None:
            try:
                print("Triggering District Analytics aggregation and seeding...")
                recalculate_district_analytics(db)
                print("District Analytics calculation complete.")
            except Exception as se:
                print(f"Error seeding district analytics: {se}")
            finally:
                db.close()
    except Exception as e:
        print(f"Skipping database table creation or analytics seeding (offline/mock mode): {e}")
    yield
    # Shutdown: Close connections
    print("Shutting down PROPINTEL AI Backend...")

app = FastAPI(
    title="PROPINTEL AI API",
    description="Backend API for PROPINTEL AI Real Estate Platform",
    version="0.1.0",
    lifespan=lifespan,
)

from fastapi.middleware.cors import CORSMiddleware

# Enable CORS for frontend API consumption
# NOTE: allow_origins=["*"] is incompatible with allow_credentials=True (browser rejects it).
# Use an explicit list of trusted origins instead.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://192.168.88.9:3000",  # LAN network address for device testing
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "propintel-api"}

@app.get("/")
async def root():
    return {"message": "Welcome to PROPINTEL AI API"}

# Register Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(tenant.router, prefix="/api/v1/tenants", tags=["Tenancy"])
app.include_router(properties.router, prefix="/api/v1/properties", tags=["Properties"])
app.include_router(rbac.router, prefix="/api/v1/rbac", tags=["RBAC"])
app.include_router(ura.router, prefix="/api/v1/ura", tags=["URA Data Pipeline"])
app.include_router(hdb.router, prefix="/api/v1/hdb", tags=["HDB Market Intelligence"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["District Analytics"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["AI Advisor Chat"])
