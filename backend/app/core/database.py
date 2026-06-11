import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Default fallback for local dev if not in docker
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://propintel:password123@localhost:5432/propintel_dev"
)

# geoalchemy2 works seamlessly with standard sqlalchemy engine
engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
