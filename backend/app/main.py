from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.database import engine
from app.models.property import Base
from app.api.endpoints import properties

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB, Redis, etc.
    print("Starting up PROPINTEL AI Backend...")
    # Initialize database tables (for dev purposes; normally use Alembic)
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: Close connections
    print("Shutting down PROPINTEL AI Backend...")

app = FastAPI(
    title="PROPINTEL AI API",
    description="Backend API for PROPINTEL AI Real Estate Platform",
    version="0.1.0",
    lifespan=lifespan,
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "propintel-api"}

@app.get("/")
async def root():
    return {"message": "Welcome to PROPINTEL AI API"}

# Register Routers
app.include_router(properties.router, prefix="/api/v1/properties", tags=["Properties"])
