from datetime import datetime, timezone
import pytest
from fastapi import HTTPException

from src.services.archive import update_event
from src.schemas.event import EventUpdate
from src.models.event import Event
from src.models.hall import Hall
from src.models.production import Production


@pytest.fixture
def production(db_session):
    prod = Production(
        id=1
    )
    db_session.add(prod)
    db_session.commit()
    return prod


def test_update_event_success(db_session, production):
    hall = Hall(name="Hall A", address="Street A")
    db_session.add(hall)
    db_session.commit()

    event = Event(
        production_id=production.id,
        hall_id=hall.id,
        order_url="some_url",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db_session.add(event)
    db_session.commit()

    update_data = EventUpdate(order_url="new_url")

    updated = update_event(
        db=db_session,
        event_id=event.id,
        update_data=update_data,
        base_url="http://test"
    )

    assert updated.order_url == "new_url"


def test_update_event_not_found(db_session):
    update_data = EventUpdate(order_url="new_url")

    with pytest.raises(HTTPException) as exc:
        update_event(
            db=db_session,
            event_id=999,  # does not exist
            update_data=update_data,
            base_url="http://test"
        )

    assert exc.value.status_code == 404


def test_update_event_invalid_hall(db_session, production):
    hall = Hall(name="Hall A", address="Street A")
    db_session.add(hall)
    db_session.commit()

    event = Event(
        production_id=production.id,
        hall_id=hall.id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db_session.add(event)
    db_session.commit()

    update_data = EventUpdate(hall_id=999)  # does not exist

    with pytest.raises(HTTPException) as exc:
        update_event(
            db=db_session,
            event_id=event.id,
            update_data=update_data,
            base_url="http://test"
        )

    assert exc.value.status_code == 404
    assert "Hall not found" in exc.value.detail


def test_update_event_partial(db_session, production):
    hall = Hall(name="Hall A", address="Street A")
    db_session.add(hall)
    db_session.commit()

    event = Event(
        production_id=production.id,
        hall_id=hall.id,
        order_url="old",
        external_order_url="old_ext",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db_session.add(event)
    db_session.commit()

    update_data = EventUpdate(order_url="new")

    updated = update_event(
        db=db_session,
        event_id=event.id,
        update_data=update_data,
        base_url="http://test"
    )

    assert updated.order_url == "new"
    assert updated.external_order_url == "old_ext"