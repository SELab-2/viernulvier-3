import pytest
from src.schemas.event import EventCreate


def test_event_create_requires_hall_or_hall_id():
    with pytest.raises(ValueError):
        EventCreate(production_id="1")


def test_event_create_cannot_have_both():
    with pytest.raises(ValueError):
        EventCreate(
            production_id=1,
            hall_id=1,
            hall={"name": "Test Hall", "address": "Street 1"}
        )


def test_event_create_with_hall_id_only():
    event = EventCreate(
        production_id="https://productions/1",
        hall_id="https://example/halls/1"
    )
    assert event.hall_id == "https://example/halls/1"
    assert event.hall is None