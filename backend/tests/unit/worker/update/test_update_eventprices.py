import logging
from datetime import datetime
from copy import deepcopy
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.event import Event, EventPrice
from src.worker.sync.store.eventprice import store_new_eventprices
from src.worker.sync.update.eventprice import store_updated_eventprices

BASE_PRICE = {
    "@id": "/api/v1/events/prices/14085",
    "created_at": "2023-01-20T10:26:50+00:00",
    "updated_at": "2023-03-04T11:16:07+00:00",
    "available": 0,
    "amount": "0.00",
    "event": "/api/v1/events/8625",
}


def _add_normal_price_with_event(db_session: Session) -> Event:
    event = Event(viernulvier_id=8625)
    db_session.add(event)
    db_session.commit()

    store_new_eventprices(db_session, [BASE_PRICE])
    db_session.commit()

    return event


# Test normal working
def test_store_updated_eventprices_normal(db_session: Session, caplog):
    caplog.set_level(logging.INFO)
    event = _add_normal_price_with_event(db_session)

    updated_price = deepcopy(BASE_PRICE)
    updated_price["amount"] = "3.14"
    updated_price["available"] = 52

    timestamp = store_updated_eventprices(db_session, [updated_price])
    db_session.commit()
    assert timestamp == datetime.fromisoformat("2023-03-04T11:16:07+00:00")

    db_prices = db_session.scalars(select(EventPrice)).all()
    assert len(db_prices) == 1

    db_price: EventPrice = db_prices[0]

    # Check that all fields are as expected
    assert db_price.viernulvier_id == 14085
    assert db_price.event_id == event.id
    assert db_price.amount == Decimal("3.14")
    assert db_price.available == 52
    assert db_price.expires_at is None  # Not set anywhere

    warnings = [r.message for r in caplog.records if r.levelno == logging.WARNING]
    assert len(warnings) == 0
    infos = [r.message for r in caplog.records if r.levelno == logging.INFO]
    assert len(infos) == 2  # Changed amount and available

    # NOTE: this order is implementation-dependant but should be deterministic
    #       if order changes in src/worker/sync/update/eventprice.py:68,
    #       this might need to change as well
    assert infos[0] == (
        "[UPDATE] amount changed from '0E-10' to '3.14' for EventPrice"
        "(viernulvier_id=14085)"
    )
    assert infos[1] == (
        "[UPDATE] available changed from '0' to '52' for EventPrice"
        "(viernulvier_id=14085)"
    )


def test_store_updated_eventprices_update_event(db_session: Session, caplog):
    caplog.set_level(logging.INFO)
    _add_normal_price_with_event(db_session)
    event2 = Event(viernulvier_id=99)
    db_session.add(event2)
    db_session.commit()

    updated_price = deepcopy(BASE_PRICE)
    updated_price["event"] = "/api/v1/events/99"

    store_updated_eventprices(db_session, [updated_price])
    db_session.commit()

    db_prices = db_session.scalars(select(EventPrice)).all()
    assert len(db_prices) == 1

    db_price: EventPrice = db_prices[0]

    assert db_price.viernulvier_id == 14085
    assert db_price.event_id == event2.id

    warnings = [r.message for r in caplog.records if r.levelno == logging.WARNING]
    assert len(warnings) == 0
    infos = [r.message for r in caplog.records if r.levelno == logging.INFO]
    assert len(infos) == 1

    assert infos[0] == (
        "[UPDATE] viernulvier_event_id changed from '8625' to '99' "
        "for EventPrice(viernulvier_id=14085)"
    )


def test_store_updated_eventprices_delete_event(db_session: Session, caplog):
    caplog.set_level(logging.INFO)
    _add_normal_price_with_event(db_session)

    updated_price = deepcopy(BASE_PRICE)
    updated_price["event"] = "/api/v1/events/99"

    timestamp = store_updated_eventprices(db_session, [updated_price])
    db_session.commit()
    assert timestamp is None

    db_prices = db_session.scalars(select(EventPrice)).all()
    assert len(db_prices) == 0

    warnings = [r.message for r in caplog.records if r.levelno == logging.WARNING]
    assert len(warnings) == 1
    infos = [r.message for r in caplog.records if r.levelno == logging.INFO]
    assert len(infos) == 0

    assert warnings[0] == (
        "[UPDATE] Deleting stored eventprice (viernulvier_id=14085) because its"
        " link to an event was removed"
    )


def test_store_updated_eventprices_unknown_eventprice(db_session: Session):
    _add_normal_price_with_event(db_session)

    # Create some new price object which' viernulvier_id is not present in DB
    updated_price = deepcopy(BASE_PRICE)
    updated_price["@id"] = "/api/v1/events/prices/20"

    timestamp = store_updated_eventprices(db_session, [updated_price])
    db_session.commit()
    assert timestamp is None

    # Old one is still present
    assert len(db_session.scalars(select(EventPrice.id)).all()) == 1


def test_store_updated_eventprices_general_error(db_session: Session, caplog):
    caplog.set_level(logging.ERROR)
    _add_normal_price_with_event(db_session)

    updated_event = deepcopy(BASE_PRICE)
    updated_event["@id"] = "mice and cheese are like cookies and milk but different"

    timestamp = store_updated_eventprices(db_session, [updated_event])
    assert timestamp is None

    errors = [r.message for r in caplog.records if r.levelno == logging.ERROR]
    assert len(errors) == 1

    assert errors[0].startswith("Error updating eventprice (")


def test_store_updated_eventprices_delete_count_warning(db_session: Session, caplog):
    caplog.set_level(logging.WARNING)

    event = Event(viernulvier_id=8625)
    db_session.add(event)
    db_session.commit()

    prices = [deepcopy(BASE_PRICE) for _ in range(6)]
    for i in range(len(prices)):
        prices[i]["@id"] = f"/api/v1/events/prices/{i + 3}"

    store_new_eventprices(db_session, prices)
    db_session.commit()

    # Now update the event URL's and check that the logger issued warning for
    # deleting all of them
    for i in range(len(prices)):
        prices[i]["event"] = "/api/v1/events/10"

    timestamp = store_updated_eventprices(db_session, prices)
    assert timestamp is None

    warnings = [r.message for r in caplog.records if r.levelno == logging.WARNING]
    assert len(warnings) == 1 + len(prices)
    assert (
        warnings[-1]
        == f"[UPDATE] Deleted {len(prices)} eventprices due to no valid event_id"
    )
