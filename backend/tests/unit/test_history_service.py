import pytest

from src.api.exceptions import NotFoundError, ValidationError
from src.models.history import History
from src.schemas.history import HistoryCreate, HistoryUpdate
from src.services.history import (
    ORDER,
    create_history,
    delete_history_entry,
    get_all_history_entries,
    get_history_entry,
    update_history,
)


BASE_URL = "http://test/api/v1/archive"


def test_create_history_success(db_session):
    history_in = HistoryCreate(
        year=2024,
        language="nl",
        title="Titel",
        content="Inhoud",
    )

    result = create_history(db_session, history_in, BASE_URL)

    assert result.id_url.startswith(f"{BASE_URL}/history/")
    assert result.year == 2024
    assert result.language == "nl"
    assert result.title == "Titel"
    assert result.content == "Inhoud"


def test_create_history_duplicate_year_language_raises(db_session):
    existing = History(year=2024, language="nl", title="Bestaat", content="Tekst")
    db_session.add(existing)
    db_session.commit()

    history_in = HistoryCreate(
        year=2024,
        language="nl",
        title="Nieuw",
        content="Nieuwe tekst",
    )

    with pytest.raises(ValidationError):
        create_history(db_session, history_in, BASE_URL)


def test_get_history_entry_success(db_session):
    entry = History(year=1999, language="en", title="Y2K", content="Some text")
    db_session.add(entry)
    db_session.commit()

    result = get_history_entry(db_session, entry.year, entry.language, BASE_URL)

    assert result.id_url == f"{BASE_URL}/history/{entry.year}/{entry.language}"
    assert result.year == 1999
    assert result.language == "en"


def test_get_history_entry_not_found(db_session):
    with pytest.raises(NotFoundError):
        get_history_entry(db_session, 9999, "nl", BASE_URL)


def test_get_all_history_entries_with_filters(db_session):
    db_session.add_all(
        [
            History(year=2023, language="nl", title="A", content="A"),
            History(year=2022, language="nl", title="B", content="B"),
            History(year=2023, language="en", title="C", content="C"),
        ]
    )
    db_session.commit()

    result = get_all_history_entries(db_session, BASE_URL, year=2023, language="nl")

    assert len(result) == 1
    assert result[0].year == 2023
    assert result[0].language == "nl"
    assert result[0].title == "A"


def test_get_all_history_entries_sort_order_descending(db_session):
    db_session.add_all(
        [
            History(year=2021, language="nl", title="A", content="A"),
            History(year=2023, language="en", title="B", content="B"),
            History(year=2022, language="nl", title="C", content="C"),
        ]
    )
    db_session.commit()

    result = get_all_history_entries(db_session, BASE_URL, sort_order=ORDER.DESCENDING)

    assert [entry.year for entry in result] == [2023, 2022, 2021]


def test_get_all_history_entries_sort_order_ascending(db_session):
    db_session.add_all(
        [
            History(year=2021, language="nl", title="A", content="A"),
            History(year=2023, language="en", title="B", content="B"),
            History(year=2022, language="nl", title="C", content="C"),
        ]
    )
    db_session.commit()

    result = get_all_history_entries(db_session, BASE_URL, sort_order=ORDER.ASCENDING)

    assert [entry.year for entry in result] == [2021, 2022, 2023]


def test_update_history_success(db_session):
    entry = History(year=2020, language="nl", title="Oud", content="Oude content")
    db_session.add(entry)
    db_session.commit()

    history_in = HistoryUpdate(title="Nieuw", content="Nieuwe content")

    result = update_history(db_session, entry.year, entry.language, history_in, BASE_URL)

    assert result.id_url == f"{BASE_URL}/history/{entry.year}/{entry.language}"
    assert result.title == "Nieuw"
    assert result.content == "Nieuwe content"
    assert result.year == 2020
    assert result.language == "nl"


def test_update_history_duplicate_year_language_raises(db_session):
    entry_a = History(year=2021, language="nl", title="A", content="A")
    entry_b = History(year=2022, language="nl", title="B", content="B")
    db_session.add_all([entry_a, entry_b])
    db_session.commit()

    history_in = HistoryUpdate(year=2021, language="nl")

    with pytest.raises(ValidationError):
        update_history(db_session, entry_b.year, entry_b.language, history_in, BASE_URL)


def test_update_history_not_found(db_session):
    with pytest.raises(NotFoundError):
        update_history(
            db_session,
            9999,
            "nl",
            HistoryUpdate(title="x"),
            BASE_URL,
        )


def test_delete_history_entry_success(db_session):
    entry = History(year=2010, language="en", title="Delete", content="Delete me")
    db_session.add(entry)
    db_session.commit()

    delete_history_entry(db_session, entry.year, entry.language)

    remaining = (
        db_session.query(History)
        .filter(History.year == entry.year, History.language == entry.language)
        .first()
    )
    assert remaining is None


def test_delete_history_entry_not_found(db_session):
    with pytest.raises(NotFoundError):
        delete_history_entry(db_session, 9999, "nl")
