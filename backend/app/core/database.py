import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Default fallback for local dev if not in docker
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://propintel:password123@localhost:5432/propintel_dev"
)

# Gracefully handle missing psycopg2 or unavailable DB for local offline development.
# All endpoints already have in-memory mock fallbacks when DB calls fail.
try:
    engine = create_engine(DATABASE_URL)
    # Test the connection immediately on startup to see if PostgreSQL is reachable.
    # If psycopg2 is missing or the server is offline, this will raise an exception
    # and trigger fallback to a local in-memory SQLite database.
    with engine.connect() as conn:
        pass
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    print("Database engine created successfully.")
except Exception as e:
    print(f"WARNING: Could not create database engine (psycopg2 missing or DB offline): {e}")
    print("Running in offline/mock mode — falling back to local in-memory SQLite database.")
    
    # Disable GeoAlchemy2 globally when running on SQLite fallback to prevent spatial function errors (like no such function: AsEWKB)
    import sys
    sys.modules['geoalchemy2'] = None
    
    # Create a no-op engine that will fail gracefully when queries run
    # All endpoints handle this with try/except and fall back to MOCK data
    from sqlalchemy import create_engine as _create_engine
    from sqlalchemy.pool import StaticPool
    try:
        # SQLite in-memory with StaticPool to keep the connection and tables alive across threads
        engine = _create_engine(
            "sqlite:///:memory:", 
            connect_args={"check_same_thread": False},
            poolclass=StaticPool
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    except Exception:
        engine = None
        SessionLocal = None

def get_db():
    if SessionLocal is None:
        # Yield a dummy that raises immediately so endpoints catch and use mock data
        raise Exception("No database session available — running in offline mock mode.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
