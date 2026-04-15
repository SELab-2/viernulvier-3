import pytest

from src.models import Event, ProdInfo, Production, Tag, TagName
from src.services.language import Languages

STATISTICS_URL = "/api/v1/archive/statistics/"


@pytest.fixture
def seed_statistics_db(db_session):
    tag1 = Tag()
    tag1.names = [
        TagName(language=Languages.NEDERLANDS, name="theater"),
        TagName(language=Languages.ENGLISH, name="theatre"),
    ]
    tag2 = Tag()
    tag2.names = [
        TagName(language=Languages.NEDERLANDS, name="muziek"),
        TagName(language=Languages.ENGLISH, name="music"),
    ]
    db_session.add_all([tag1, tag2])

    prod1 = Production(tags=[tag1])
    prod2 = Production(tags=[tag2])
    prod3 = Production(tags=[tag1, tag2])
    db_session.add_all([prod1, prod2, prod3])
    db_session.flush()

    db_session.add_all(
        [
            ProdInfo(production_id=prod1.id, language=Languages.NEDERLANDS, artist="Artist A"),
            ProdInfo(production_id=prod1.id, language=Languages.ENGLISH, artist="Artist A"),
            ProdInfo(production_id=prod2.id, language=Languages.NEDERLANDS, artist="Artist B"),
            ProdInfo(production_id=prod3.id, language=Languages.NEDERLANDS, artist=""),
        ]
    )

    db_session.add_all(
        [
            Event(production_id=prod1.id),
            Event(production_id=prod1.id),
            Event(production_id=prod2.id),
        ]
    )
    db_session.commit()


def test_get_statistics_endpoint_returns_expected_shape_and_values(client, seed_statistics_db):
    response = client.get(STATISTICS_URL)

    assert response.status_code == 200

    data = response.json()
    assert "productions_count" in data
    assert "events_count" in data
    assert "unique_artists_count" in data
    assert "tags_count" in data

    assert data["productions_count"] == 3
    assert data["events_count"] == 3
    assert data["unique_artists_count"] == 2
    assert data["tags_count"] == 2


def test_get_statistics_endpoint_empty_database(client):
    response = client.get(STATISTICS_URL)

    assert response.status_code == 200

    data = response.json()
    assert data["productions_count"] == 0
    assert data["events_count"] == 0
    assert data["unique_artists_count"] == 0
    assert data["tags_count"] == 0
