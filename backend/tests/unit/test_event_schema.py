import pytest
from src.schemas.event import EventCreate


def test_event_create_requires_hall_or_hall_id():
    with pytest.raises(ValueError):
        EventCreate(production_id_url="https://productions/1")


def test_event_create_with_hall_id_only():
    event = EventCreate(
        production_id_url="https://productions/1", hall_id_url="https://example/halls/1"
    )
    assert event.hall_id_url == "https://example/halls/1"
