import logging
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy.sql import select
from src.models.event import Event, EventPrice
from src.worker.converters.eventprice import api_eventprice_to_model_eventprice
from src.worker.sync.update.utils import sync_simple_fields

logger = logging.getLogger(__name__)


def store_updated_eventprices(db_session: Session, eventprices: list[dict]):
    newest_timestamp = None

    existing_events = db_session.execute(select(Event.id, Event.viernulvier_id))
    event_map: dict[int, int] = {
        event_viernulvier_id: event_id
        for event_id, event_viernulvier_id in existing_events
    }

    deletes = 0

    for json_price in eventprices:
        try:
            updated_eventprice, viernulvier_event_id = (
                api_eventprice_to_model_eventprice(json_price)
            )

            # Find the eventprice to update in our database
            existing_price: EventPrice = db_session.scalar(
                select(EventPrice).where(
                    EventPrice.viernulvier_id == updated_eventprice.viernulvier_id
                )
            )

            # Drop unknown price
            if not existing_price:
                continue

            # Check if the eventprice is tied to a valid event, else we would get a
            # ForeignKey violation
            internal_event_id = event_map.get(viernulvier_event_id)
            if not viernulvier_event_id or not internal_event_id:
                logger.warning(
                    f"[UPDATE] Deleting stored eventprice (viernulvier_id="
                    f"{updated_eventprice.viernulvier_id}) because its link to "
                    "an event was removed"
                )
                db_session.delete(existing_price)
                deletes += 1
                continue

            # Update tied event if needed
            if internal_event_id != existing_price.event_id:
                logger.info(
                    f"[UPDATE] viernulvier_event_id changed from "
                    f"'{existing_price.event.viernulvier_id}' to "
                    f"'{viernulvier_event_id}' "
                    f"for EventPrice(viernulvier_id={existing_price.viernulvier_id})"
                )
                existing_price.event_id = internal_event_id

            # Update the simple fields that are not linked to other DB tables
            sync_simple_fields(
                existing_price,
                updated_eventprice,
                ["amount", "available", "expires_at"],
                "EventPrice",
            )

            # No need to call merge as sqlalchemy does that for us

            # Set newest_timestamp to later update sync_state DB table
            updated_at_str = json_price.get("updated_at")
            if updated_at_str:
                updated_at = datetime.fromisoformat(updated_at_str)
                if newest_timestamp is None or updated_at > newest_timestamp:
                    newest_timestamp = updated_at

        except Exception as e:
            logger.error(f"Error updating eventprice ({json_price}):\n{e}")

    if deletes > 2:
        logger.warning(
            f"[UPDATE] Deleted {deletes} eventprices due to no valid event_id"
        )

    return newest_timestamp
