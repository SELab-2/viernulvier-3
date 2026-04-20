# Configuratie van integratietesten
import os

import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from src.database import Base, get_db
from src.main import app
from src.models.production import ProdInfo, Production
from src.models.event import Event
from src.models.tag import Tag, TagName
from src.services.language import Languages
from src.models import Media

from unittest.mock import Mock
from src.services.media import get_minio_client


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
    import os

    os.environ["TESTING"] = "1"  # Skip MinIO
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    del os.environ["TESTING"]  # Clean up


@pytest.fixture(autouse=True)
def mock_minio_dependency():
    mock_client = Mock()
    mock_client.bucket_exists.return_value = True
    mock_client.put_object.return_value = Mock()
    mock_client.remove_object.return_value = None
    app.dependency_overrides[get_minio_client] = lambda: mock_client
    yield
    app.dependency_overrides.pop(get_minio_client, None)


# Mock data for testing.
@pytest.fixture
def productions_limited(db_session):
    tag1 = Tag()
    tag1.names = [
        TagName(language=Languages.NEDERLANDS, name="theater"),
        TagName(language=Languages.ENGLISH, name="theatre"),
    ]
    tag2 = Tag()
    tag2.names = [
        TagName(language=Languages.NEDERLANDS, name="band"),
        TagName(language=Languages.ENGLISH, name="band"),
    ]
    tag3 = Tag()
    tag3.names = [
        TagName(language=Languages.NEDERLANDS, name="groep"),
        TagName(language=Languages.ENGLISH, name="group"),
    ]
    tag4 = Tag()
    tag4.names = [
        TagName(language=Languages.NEDERLANDS, name="muziek"),
        TagName(language=Languages.ENGLISH, name="music"),
    ]
    db_session.add_all([tag1, tag2, tag3, tag4])

    prod1 = Production(
        performer_type="theater",
        attendance_mode="offline",
        earliest_at=datetime.fromtimestamp(123123),
        latest_at=datetime.fromtimestamp(223123),
        tags=[tag1, tag3],
    )
    prod2 = Production(
        performer_type="concert",
        attendance_mode="online",
        tags=[tag2, tag3, tag4],
        earliest_at=datetime.fromtimestamp(423123),
        latest_at=datetime.fromtimestamp(823123),
    )
    db_session.add_all([prod1, prod2])
    db_session.flush()

    info1_nl = ProdInfo(
        production_id=prod1.id, language=Languages.NEDERLANDS, title="prod1_nl"
    )
    info1_en = ProdInfo(
        production_id=prod1.id, language=Languages.ENGLISH, title="prod1_en"
    )
    info2_nl = ProdInfo(
        production_id=prod2.id, language=Languages.NEDERLANDS, title="prod2_nl"
    )

    db_session.add_all([info1_nl, info1_en, info2_nl])
    db_session.commit()

    events1 = [
        Event(production_id=prod1.id, starts_at=datetime.fromtimestamp(123123))
        for _ in range(2)
    ]
    events2 = [
        Event(production_id=prod2.id, starts_at=datetime.fromtimestamp(223123))
        for _ in range(4)
    ]

    db_session.add_all(events1 + events2)
    db_session.commit()

    db_session.refresh(prod1)
    db_session.refresh(prod2)
    return [prod1, prod2]


@pytest.fixture
def many_productions(db_session):
    productions = []
    tag1 = Tag()
    tag1.names = [
        TagName(language=Languages.NEDERLANDS, name="theater"),
        TagName(language=Languages.ENGLISH, name="theatre"),
    ]
    tag2 = Tag()
    tag2.names = [
        TagName(language=Languages.NEDERLANDS, name="band"),
        TagName(language=Languages.ENGLISH, name="band"),
    ]
    db_session.add_all([tag1, tag2])

    for i in range(10):
        artist = "Steve" if i % 2 == 0 else "Bob"
        add_tags = [tag1]
        if i % 2 == 0:
            add_tags = [tag2]

        prod = Production(
            performer_type="theater",
            attendance_mode="offline",
            tags=add_tags,
        )
        db_session.add(prod)
        db_session.flush()

        info_nl = ProdInfo(
            production_id=prod.id,
            language=Languages.NEDERLANDS,
            title=f"prod{i}_nl",
            artist=artist,
        )
        info_en = ProdInfo(
            production_id=prod.id,
            language=Languages.ENGLISH,
            title=f"prod{i}_en",
            artist=artist,
        )
        db_session.add_all([info_nl, info_en])
        productions.append(prod)

    db_session.commit()
    return productions


@pytest.fixture
def production_with_no_media(db_session: Session) -> Production:
    prod = Production(
        performer_type="band",
        attendance_mode="offline",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(prod)
    db_session.commit()
    db_session.refresh(prod)
    return prod


@pytest.fixture
def media_item(db_session, production_with_no_media):
    media = Media(
        production_id=production_with_no_media.id,
        object_key=f"gallery-{production_with_no_media.id}/example.jpg",
        content_type="image/jpeg",
        uploaded_at=datetime.now(timezone.utc),
    )
    db_session.add(media)
    db_session.commit()
    db_session.refresh(media)
    return media


@pytest.fixture
def media_items_for_production(db_session, production_with_no_media):
    items = []
    for idx in range(3):
        m = Media(
            production_id=production_with_no_media.id,
            object_key=f"gallery-{production_with_no_media.id}/file-{idx}.jpg",
            content_type="image/jpeg",
            uploaded_at=datetime.now(timezone.utc),
        )
        db_session.add(m)
        items.append(m)
    db_session.commit()
    for m in items:
        db_session.refresh(m)
    return items
