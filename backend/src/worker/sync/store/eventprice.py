import logging
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy.sql import select
from src.models.event import Event
from src.worker.converters.eventprice import api_eventprice_to_model_eventprice

logger = logging.getLogger(__name__)


def store_new_eventprices(db_session: Session, eventprices: list[dict]):
    newest_timestamp = None

    existing_events = db_session.execute(select(Event.id, Event.viernulvier_id))
    event_map: dict[int, int] = {
        event_viernulvier_id: event_id
        for event_id, event_viernulvier_id in existing_events
    }

    orphans = 0

    for json_price in eventprices:
        try:
            eventprice, viernulvier_event_id = api_eventprice_to_model_eventprice(
                json_price
            )

            # Check if the eventprice is tied to a valid event, else we would get a
            # ForeignKey violation
            if not viernulvier_event_id:
                logger.warning(
                    f"Not storing eventprice (id={eventprice.viernulvier_id}) "
                    "because no associated event"
                )
                orphans += 1
                continue

            internal_event_id = event_map.get(viernulvier_event_id)

            if not internal_event_id:
                logger.warning(
                    f"Not storing eventprice (id={eventprice.viernulvier_id}) because "
                    f"the associated event (id={viernulvier_event_id}) does not "
                    "exist (anymore)"
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

        except Exception as e:
            logger.warn(f"Error storing genre ({json_price}):\n{e}")

    if orphans > 2:
        logger.warning(f"Skipped {orphans} eventprices due to no valid event_id")

    return newest_timestamp
