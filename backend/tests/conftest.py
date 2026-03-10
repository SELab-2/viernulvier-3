# Configuratie van integratietesten
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from src.database import Base, get_db
from src.main import app
from sqlalchemy.orm import Session
from src.models.language import Language
from src.models.production import ProdInfo, Production
from src.models.event import Event

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


# Mock data for testing.
@pytest.fixture
def productions_limited(db_session, language_nl, language_en):
    prod1 = Production(
        performer_type="theater", attendance_mode="offline", media_gallery_id=1
    )
    prod2 = Production(
        performer_type="concert", attendance_mode="online", media_gallery_id=2
    )
    db_session.add_all([prod1, prod2])
    db_session.flush()

    info1_nl = ProdInfo(
        production_id=prod1.id, language_id=language_nl.id, title="prod1_nl"
    )
    info1_en = ProdInfo(
        production_id=prod1.id, language_id=language_en.id, title="prod1_en"
    )
    info2_nl = ProdInfo(
        production_id=prod2.id, language_id=language_nl.id, title="prod2_nl"
    )

    db_session.add_all([info1_nl, info1_en, info2_nl])
    db_session.commit()

    events1 = [Event(production_id=prod1.id) for _ in range(2)]
    events2 = [Event(production_id=prod2.id) for _ in range(4)]

    db_session.add_all(events1 + events2)
    db_session.commit()

    db_session.refresh(prod1)
    db_session.refresh(prod2)
    return [prod1, prod2]


@pytest.fixture
def many_productions(db_session, language_nl, language_en):
    productions = []
    for i in range(10):
        prod = Production(
            performer_type="theater", attendance_mode="offline", media_gallery_id=i + 1
        )
        db_session.add(prod)
        db_session.flush()

        info_nl = ProdInfo(
            production_id=prod.id, language_id=language_nl.id, title=f"prod{i}_nl"
        )
        info_en = ProdInfo(
            production_id=prod.id, language_id=language_en.id, title=f"prod{i}_en"
        )
        db_session.add_all([info_nl, info_en])
        productions.append(prod)

    db_session.commit()
    return productions


@pytest.fixture
def language_nl(db_session: Session):
    lang = Language(id=1, language="nl")
    db_session.add(lang)
    db_session.commit()
    db_session.refresh(lang)
    return lang


@pytest.fixture
def language_en(db_session: Session):
    lang = Language(id=2, language="en")
    db_session.add(lang)
    db_session.commit()
    db_session.refresh(lang)
    return lang
