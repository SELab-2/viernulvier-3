import pytest
from datetime import datetime, timezone

from src.services.event_service import (
    get_event_by_id,
    create_event,
    update_event,
    delete_event_by_id,
    get_prices_for_event,
    get_event_price,
)

from src.schemas.event import EventCreate, EventUpdate
from src.models.event import Event, EventPrice
from src.models.hall import Hall
from src.models.production import Production
from src.api.exceptions import NotFoundError


BASE_URL = "http://test"


@pytest.fixture
def production(db_session):
    prod = Production(id=1)
    db_session.add(prod)
    db_session.commit()
    return prod


@pytest.fixture
def hall(db_session):
    hall = Hall(name="Hall A", address="Street A")
    db_session.add(hall)
    db_session.commit()
    return hall


@pytest.fixture
def event(db_session, production, hall):
    event = Event(
        production_id=production.id,
        hall_id=hall.id,
        order_url="old_url",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(event)
    db_session.commit()
    return event


def test_get_event_by_id_success(db_session, event):
    result = get_event_by_id(db_session, event.id, BASE_URL)

    assert result.id_url == f"{BASE_URL}/events/{event.id}"
    assert result.hall.id_url == f"{BASE_URL}/halls/{event.hall_id}"


def test_get_event_by_id_with_null_hall_returns_null_hall_id(db_session, production):
    event = Event(
        production_id=production.id,
        hall_id=None,
        order_url="old_url",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(event)
    db_session.commit()

    result = get_event_by_id(db_session, event.id, BASE_URL)

    assert result.id_url == f"{BASE_URL}/events/{event.id}"
    assert result.hall is None


def test_get_event_by_id_not_found(db_session):
    with pytest.raises(NotFoundError):
        get_event_by_id(db_session, 999, BASE_URL)


def test_make_event_with_existing_hall(db_session, production, hall):
    event_in = EventCreate(
        production_id_url=f"{BASE_URL}/productions/{production.id}",
        hall_id_url=f"{BASE_URL}/halls/{hall.id}",
    )

    result = create_event(db_session, event_in, BASE_URL)

    assert result.production_id_url == f"{BASE_URL}/productions/{production.id}"
    assert result.hall.id_url == f"{BASE_URL}/halls/{hall.id}"


def test_make_event_invalid_hall(db_session, production):
    event_in = EventCreate(
        production_id_url=f"{BASE_URL}/productions/{production.id}",
        hall_id_url=f"{BASE_URL}/halls/999",
    )

    with pytest.raises(NotFoundError):
        create_event(db_session, event_in, BASE_URL)


def test_update_event_success(db_session, event):
    update_data = EventUpdate(order_url="new_url")

    updated = update_event(db_session, event.id, update_data, BASE_URL)

    assert updated.order_url == "new_url"


def test_update_event_not_found(db_session):
    update_data = EventUpdate(order_url="new_url")

    with pytest.raises(NotFoundError):
        update_event(db_session, 999, update_data, BASE_URL)


def test_update_event_invalid_hall(db_session, event):
    update_data = EventUpdate(hall_id_url=f"{BASE_URL}/halls/999")

    with pytest.raises(NotFoundError):
        update_event(db_session, event.id, update_data, BASE_URL)


def test_delete_event_success(db_session, event):
    result = delete_event_by_id(db_session, event.id)

    assert result is True


def test_delete_event_not_found(db_session):
    with pytest.raises(NotFoundError):
        delete_event_by_id(db_session, 999)


def test_get_prices_for_event(db_session, event):
    price = EventPrice(event_id=event.id, amount=10, available=100)

    db_session.add(price)
    db_session.commit()

    prices = get_prices_for_event(db_session, event.id, BASE_URL)

    assert len(prices) == 1
    assert prices[0].amount == 10


def test_get_event_price_success(db_session, event):
    price = EventPrice(event_id=event.id, amount=50)

    db_session.add(price)
    db_session.commit()

    result = get_event_price(db_session, event.id, price.id, BASE_URL)

    assert result.amount == 50


def test_get_event_price_not_found(db_session, event):
    with pytest.raises(NotFoundError):
        get_event_price(db_session, event.id, 999, BASE_URL)
