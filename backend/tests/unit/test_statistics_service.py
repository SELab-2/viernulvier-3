import pytest

from src.models import Event, ProdInfo, Production, Tag, TagName
from src.schemas.statistics import StatisticsResponse
from src.services.language import Languages
from src.services.statistics import get_statistics

BASE_URL = "http://test"


@pytest.fixture
def statistics_data(db_session):
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
            ProdInfo(
                production_id=prod1.id, language=Languages.NEDERLANDS, artist="Artist A"
            ),
            ProdInfo(
                production_id=prod1.id, language=Languages.ENGLISH, artist="Artist A"
            ),
            ProdInfo(
                production_id=prod2.id, language=Languages.NEDERLANDS, artist="Artist B"
            ),
            ProdInfo(production_id=prod3.id, language=Languages.NEDERLANDS, artist=""),
            ProdInfo(production_id=prod3.id, language=Languages.ENGLISH, artist=None),
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

    return {"tag_ids": [tag1.id, tag2.id]}


def test_get_statistics_returns_expected_counts_and_tags(db_session, statistics_data):
    result = get_statistics(db_session, BASE_URL)

    assert isinstance(result, StatisticsResponse)
    assert result.productions_count == 3
    assert result.events_count == 3
    assert result.unique_artists_count == 2
    assert result.tags_count == 2


def test_get_statistics_empty_database(db_session):
    result = get_statistics(db_session, BASE_URL)

    assert result.productions_count == 0
    assert result.events_count == 0
    assert result.unique_artists_count == 0
    assert result.tags_count == 0
