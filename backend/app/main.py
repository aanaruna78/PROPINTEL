from fastapi import FastAPI
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB, Redis, etc.
    print("Starting up PROPINTEL AI Backend...")
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
