"""
Dit bestand gebruikt nogal veel van tests/unit/worker/test_stores.py.
Superveel eigenlijk. Dit omdat het logisch is om eerst een store te doen,
en daarna de data aan te passen om te updaten
"""

import logging
from copy import deepcopy
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.event import Event
from src.models.hall import Hall
from src.models.production import Production
from src.worker.sync.store.event import store_new_events
from src.worker.sync.update.event import store_updated_events
from src.worker.sync.update.utils import comparable

# Real event data from the API, some fields removed
BASE_EVENT = {
    "@id": "/api/v1/events/6169",
    "created_at": "2021-08-16T14:36:53+00:00",
    "updated_at": "2025-09-16T07:33:34+00:00",
    "starts_at": "2021-11-26T19:00:00+00:00",
    "ends_at": "2021-11-26T20:00:00+00:00",
    "hall": "/api/v1/halls/12",
    "production": {
        "@type": "StandardProduction",
        "@id": "/api/v1/productions/4129",
    },
}


# Helper function for some boilerplate, returns the created production to be
# able to use its generated id
def _add_normal_event_with_prod_and_hall(db_session: Session) -> Production:
    # Add a dummy production to the DB so that an event can be stored
    prod = Production(viernulvier_id=4129)
    hall = Hall(viernulvier_id=12)
    db_session.add_all([prod, hall])
    db_session.commit()

    # Store the events
    store_new_events(db_session, [BASE_EVENT])
    db_session.commit()
    return prod, hall


# Test if events are correctly put inside our database, or not when they
# need not be added
def test_store_updated_events_normal(db_session: Session, caplog):
    caplog.set_level(logging.INFO)
    prod, hall = _add_normal_event_with_prod_and_hall(db_session)

    updated_event = deepcopy(BASE_EVENT)
    updated_event["starts_at"] = "2021-11-26T18:00:00+00:00"
    updated_event["external_order_url"] = {"nl": "https://www.example.org"}

    timestamp = store_updated_events(db_session, [updated_event])
    db_session.commit()
    assert timestamp == datetime.fromisoformat("2025-09-16T07:33:34+00:00")

    db_events = db_session.scalars(select(Event)).all()
    assert len(db_events) == 1

    db_event: Event = db_events[0]

    # Check that all the fields are as expected
    assert db_event.viernulvier_id == 6169
    assert db_event.production_id == prod.id
    assert db_event.hall_id == hall.id
    assert comparable(db_event.starts_at) == datetime.fromisoformat(
        "2021-11-26T18:00:00+00:00"
    )
    assert comparable(db_event.ends_at) == datetime.fromisoformat(
        "2021-11-26T20:00:00+00:00"
    )
    assert db_event.order_url == "https://www.example.org"

    warnings = [r.message for r in caplog.records if r.levelno == logging.WARNING]
    assert len(warnings) == 0
    infos = [r.message for r in caplog.records if r.levelno == logging.INFO]
    assert len(infos) == 2  # Changed starts_at and order_url

    # NOTE: this order is implementation-dependant but should be deterministic
    #       if order changes in src/worker/sync/update/event.py:113,
    #       this might need to change as well
    assert infos[0].startswith("[UPDATE] starts_at changed from '")
    assert infos[0].endswith("' for Event(viernulvier_id=6169)")

    assert infos[1] == (
        "[UPDATE] order_url changed from 'None' to 'https://www.example.org' "
        "for Event(viernulvier_id=6169)"
    )


def test_store_updated_events_update_prod(db_session: Session, caplog):
    caplog.set_level(logging.INFO)
    _add_normal_event_with_prod_and_hall(db_session)
    prod2 = Production(viernulvier_id=323)
    db_session.add(prod2)
    db_session.commit()

    updated_event = deepcopy(BASE_EVENT)
    updated_event["production"] = {"@id": "/api/v1/productions/323"}

    store_updated_events(db_session, [updated_event])
    db_session.commit()

    db_events = db_session.scalars(select(Event)).all()
    assert len(db_events) == 1

    db_event: Event = db_events[0]

    # Check that all the fields are as expected
    assert db_event.viernulvier_id == 6169
    assert db_event.production_id == prod2.id

    warnings = [r.message for r in caplog.records if r.levelno == logging.WARNING]
    assert len(warnings) == 0
    infos = [r.message for r in caplog.records if r.levelno == logging.INFO]
    assert len(infos) == 1

    assert infos[0] == (
        "[UPDATE] viernulvier_production_id changed from '4129' to '323' "
        "for Event(viernulvier_id=6169)"
    )


def test_store_updated_events_delete_production(db_session: Session, caplog):
    caplog.set_level(logging.INFO)
    _add_normal_event_with_prod_and_hall(db_session)

    updated_event = deepcopy(BASE_EVENT)
    updated_event["production"] = {"@id": "/api/v1/productions/1"}

    timestamp = store_updated_events(db_session, [updated_event])
    db_session.commit()
    assert timestamp is None

    db_events = db_session.scalars(select(Event)).all()
    assert len(db_events) == 0

    warnings = [r.message for r in caplog.records if r.levelno == logging.WARNING]
    assert len(warnings) == 1
    infos = [r.message for r in caplog.records if r.levelno == logging.INFO]
    assert len(infos) == 0

    assert warnings[0] == (
        "[UPDATE] Deleting stored event (viernulvier_id=6169) because its link "
        "to a production was removed"
    )


def test_store_updated_events_update_hall_normal(db_session: Session, caplog):
    caplog.set_level(logging.INFO)
    _add_normal_event_with_prod_and_hall(db_session)
    hall2 = Hall(viernulvier_id=57)
    db_session.add(hall2)
    db_session.commit()

    updated_event = deepcopy(BASE_EVENT)
    updated_event["hall"] = "/api/v1/halls/57"

    timestamp = store_updated_events(db_session, [updated_event])
    db_session.commit()

    assert timestamp is not None

    db_events = db_session.scalars(select(Event)).all()
    assert len(db_events) == 1

    warnings = [r.message for r in caplog.records if r.levelno == logging.WARNING]
    assert len(warnings) == 0
    infos = [r.message for r in caplog.records if r.levelno == logging.INFO]
    assert len(infos) == 1

    assert infos[0] == (
        "[UPDATE] viernulvier_hall_id changed from '12' to '57' "
        "for Event(viernulvier_id=6169)"
    )


def test_store_updated_events_update_hall_unknown(db_session: Session, caplog):
    caplog.set_level(logging.INFO)
    _add_normal_event_with_prod_and_hall(db_session)

    updated_event = deepcopy(BASE_EVENT)
    updated_event["hall"] = "/api/v1/halls/57"

    timestamp = store_updated_events(db_session, [updated_event])
    db_session.commit()

    assert timestamp is not None

    db_events = db_session.scalars(select(Event)).all()
    assert len(db_events) == 1

    warnings = [r.message for r in caplog.records if r.levelno == logging.WARNING]
    assert len(warnings) == 1
    infos = [r.message for r in caplog.records if r.levelno == logging.INFO]
    assert len(infos) == 0

    assert warnings[0] == (
        "[UPDATE] Event (viernulvier_id=6169) references hall with "
        "viernulvier_id=57, but this hall does not exist in the database. "
        "Not updating the hall for this event."
    )


def test_store_updated_events_update_hall_delete(db_session: Session, caplog):
    caplog.set_level(logging.INFO)
    _add_normal_event_with_prod_and_hall(db_session)

    updated_event = deepcopy(BASE_EVENT)
    updated_event["hall"] = None

    timestamp = store_updated_events(db_session, [updated_event])
    db_session.commit()

    assert timestamp is not None

    db_events = db_session.scalars(select(Event)).all()
    assert len(db_events) == 1
    assert db_events[0].hall_id is None

    warnings = [r.message for r in caplog.records if r.levelno == logging.WARNING]
    assert len(warnings) == 0
    infos = [r.message for r in caplog.records if r.levelno == logging.INFO]
    assert len(infos) == 1

    assert infos[0] == (
        "[UPDATE] hall for Event(viernulvier_id=6169) was deleted, deleting the "
        "reference to Hall(viernulvier_id=12)"
    )


def test_store_updated_events_unknown_event(db_session: Session, caplog):
    caplog.set_level(logging.INFO)
    _add_normal_event_with_prod_and_hall(db_session)

    updated_event = deepcopy(BASE_EVENT)
    updated_event["@id"] = "/api/v1/events/1"

    timestamp = store_updated_events(db_session, [updated_event])
    db_session.commit()
    assert timestamp is None

    db_events = db_session.scalars(select(Event)).all()
    assert len(db_events) == 1


def test_store_updated_events_general_error(db_session: Session, caplog):
    caplog.set_level(logging.ERROR)
    _add_normal_event_with_prod_and_hall(db_session)

    updated_event = deepcopy(BASE_EVENT)
    updated_event["@id"] = "strange things"

    timestamp = store_updated_events(db_session, [updated_event])
    assert timestamp is None

    errors = [r.message for r in caplog.records if r.levelno == logging.ERROR]
    assert len(errors) == 1

    assert errors[0].startswith("Error updating event (")


def test_store_updated_events_delete_count_warning(db_session, caplog):
    caplog.set_level(logging.WARNING)

    # Populate database with production and 6 events for that production
    prod = Production(viernulvier_id=4129)
    db_session.add(prod)
    db_session.commit()

    events = [deepcopy(BASE_EVENT) for _ in range(6)]
    for i in range(len(events)):
        events[i]["@id"] = f"/api/v1/events/{i + 3}"
        del events[i]["hall"]

    # Store the events
    store_new_events(db_session, events)
    db_session.commit()

    # Now update the production URL's and check that the logger issued a warning
    for i in range(len(events)):
        events[i]["production"]["@id"] = "/api/v1/productions/900"

    timestamp = store_updated_events(db_session, events)
    assert timestamp is None

    warnings = [r.message for r in caplog.records if r.levelno == logging.WARNING]
    assert len(warnings) == 1 + len(events)
    assert (
        warnings[-1]
        == f"[UPDATE] Deleted {len(events)} events due to no valid production_id"
    )
