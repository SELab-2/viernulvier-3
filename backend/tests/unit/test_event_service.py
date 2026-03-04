from src.services.archive import update_event
from src.schemas.event import EventUpdate
from src.models.event import Event
from src.models.hall import Hall
import pytest
from fastapi import HTTPException


def test_update_event_success(db_session):
    hall = Hall(name="Hall A", address="Street A")
    db_session.add(hall)
    db_session.commit()

    event = Event(
        production_id=1,
        hall_id=hall.id,
        order_url="old_url"
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
            event_id=999,
            update_data=update_data,
            base_url="http://test"
        )

    assert exc.value.status_code == 404
    
    
def test_update_event_invalid_hall(db_session):
    hall = Hall(name="Hall A", address="Street A")
    db_session.add(hall)
    db_session.commit()

    event = Event(
        production_id=1,
        hall_id=hall.id
    )
    db_session.add(event)
    db_session.commit()

    update_data = EventUpdate(hall_id=999)

    with pytest.raises(HTTPException) as exc:
        update_event(
            db=db_session,
            event_id=event.id,
            update_data=update_data,
            base_url="http://test"
        )

    assert exc.value.status_code == 404
    assert "Hall not found" in exc.value.detail
    
    
def test_update_event_partial(db_session):
    hall = Hall(name="Hall A", address="Street A")
    db_session.add(hall)
    db_session.commit()

    event = Event(
        production_id=1,
        hall_id=hall.id,
        order_url="old",
        external_order_url="old_ext"
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
    
    
