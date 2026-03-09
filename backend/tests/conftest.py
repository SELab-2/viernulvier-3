# Configuratie van integratietesten
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from src.database import Base, get_db
from src.main import app

# Laat CI/CD pipelines een echte PostgreSQL test database URL injecteren
# via omgevingsvariabelen.
# Val terug op in-memory SQLite voor snelle, lokale developer testen.
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite://")

# Configureer de engine op basis van het database type
if TEST_DATABASE_URL.startswith("sqlite"):
    test_engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    # Voor PostgreSQL hebben we de SQLite-specifieke argumenten niet nodig
    if TEST_DATABASE_URL.startswith("postgresql://"):
        TEST_DATABASE_URL = TEST_DATABASE_URL.replace(
            "postgresql://", "postgresql+psycopg2://"
        )
    test_engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)

TEST_SESSION_LOCAL = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


# Overschrijf dependency
def override_get_db():
    db = TEST_SESSION_LOCAL()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function", autouse=True)
def setup_test_db():

    # Maak tabellen aan voordat testen draaien
    Base.metadata.create_all(bind=test_engine)
    yield
    # Verwijder tabellen nadat testen klaar zijn
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """
    Levert een database sessie voor unit testen.
    Omdat setup_test_db autouse=True is, zijn de tabellen al aangemaakt.
    """
    db = TEST_SESSION_LOCAL()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session")
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
