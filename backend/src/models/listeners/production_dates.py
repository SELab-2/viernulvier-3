from sqlalchemy import event, func, inspect, select
from sqlalchemy.orm import Session
from src.models.event import Event
from src.models.production import Production


# Updates a production's earliest_at and latest_at fields
def update_production_dates(db: Session, production_id: int):
    stmt = select(
        func.min(Event.starts_at),
        func.max(Event.starts_at),
    ).where(Event.production_id == production_id)

    earliest_at, latest_at = db.execute(stmt).one_or_none()

    production = db.get(Production, production_id)
    if production:
        production.earliest_at = earliest_at
        production.latest_at = latest_at


@event.listens_for(Event, "after_insert")
def after_insert_event(_, connection, event: Event):
    db_session = Session(bind=connection)
    update_production_dates(db_session, event.production_id)
    db_session.commit()


@event.listens_for(Event, "after_update")
def after_update_event(_, connection, event: Event):
    state = inspect(event)

    if (
        state.attrs.starts_at.history.has_changes()
        or state.attrs.production_id.history.has_changes()
    ):
        db_session = Session(bind=connection)

        # If production_id changed, update both old and new productions
        if state.attrs.production_id.history.has_changes():
            hist = state.attrs.production_id.history

            if hist.deleted:
                update_production_dates(db_session, hist.deleted[0])
            if hist.added:
                update_production_dates(db_session, hist.added[0])
        else:
            update_production_dates(db_session, event.production_id)

        db_session.commit()


@event.listens_for(Event, "after_delete")
def after_delete_event(_, connection, event: Event):
    db_session = Session(bind=connection)
    update_production_dates(db_session, event.production_id)
    db_session.commit()
