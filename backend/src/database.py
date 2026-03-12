"""
Database-verbinding en sessie-afhandeling.

Levert een database-sessie aan elke request via ``Depends(get_db)``.
``Base`` wordt hier gedefinieerd zodat alle modellen dezelfde declarative base delen.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from src.config import settings

Base = declarative_base()

engine = create_engine(settings.database_url, pool_pre_ping=True)
SESSION_LOCAL = sessionmaker(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency die een database-sessie levert en correct afsluit."""
    db = SESSION_LOCAL()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Maak alle tabellen aan als ze nog niet bestaan."""
    Base.metadata.create_all(bind=engine)
