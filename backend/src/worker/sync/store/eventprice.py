import logging
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy.sql import select
from src.models.event import Event
from src.worker.converters.eventprice import api_eventprice_to_model_eventprice

logger = logging.getLogger(__name__)


def store_new_eventprices(
    db_session: Session, language_map: dict[str, int], eventprices: list[dict]
):
    newest_timestamp = None

    existing_events = set(db_session.execute(select(Event.id)).scalars())
    orphans = 0

    for json_price in eventprices:
        eventprice = api_eventprice_to_model_eventprice(json_price)

        # Check if the eventprice is tied to a valid event, else we would get a
        # ForeignKey violation
        if not eventprice.event_id:
            logger.warning(
                f"Not storing eventprice (id={
                    eventprice.id
                }) because no associated event"
            )
            orphans += 1
            continue

        elif eventprice.event_id not in existing_events:
            logger.warning(
                f"Not storing eventprice (id={eventprice.id}) because the associated "
                f"event (id={eventprice.event_id}) does not exist (anymore)"
            )
            orphans += 1
            continue

        # Valid event id, so store this eventprice
        db_session.merge(eventprice)

        created_at_str = json_price.get("created_at")
        if created_at_str:
            created_at_str = datetime.fromisoformat(created_at_str)
            if newest_timestamp is None or created_at_str > newest_timestamp:
                newest_timestamp = created_at_str

    if orphans > 2:
        logger.warning(f"Skipped {orphans} eventprices due to no valid event_id")

    return newest_timestamp
