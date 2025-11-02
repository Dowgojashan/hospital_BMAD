import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://appuser:password@db:5432/hospital")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    logger.info("get_db: start")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        logger.info("get_db: end")
