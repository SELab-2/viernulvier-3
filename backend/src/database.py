"""
Database connection and session handling.
Provides a database session to each request via ``Depends(get_db)``.
``Base`` is defined here so that all models share the same declarative base.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from src.config import settings

Base = declarative_base()

engine = create_engine(settings.database_url, pool_pre_ping=True)
SESSION_LOCAL = sessionmaker(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency that provides a database session and closes it correctly."""
    db = SESSION_LOCAL()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Make all tables if not yet exists"""
    Base.metadata.create_all(bind=engine)
