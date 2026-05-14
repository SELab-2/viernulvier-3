import logging
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy.sql import select
from src.models.event import Event
from src.models.hall import Hall
from src.models.production import Production
from src.worker.converters.event import api_event_to_model_event
from src.worker.sync.update.utils import sync_simple_fields

logger = logging.getLogger(__name__)


def store_updated_events(db_session: Session, events: list[dict]):
    newest_timestamp = None

    existing_productions = db_session.execute(
        select(Production.id, Production.viernulvier_id)
    )
    prod_map: dict[int, int] = {
        prod_viernulvier_id: prod_id
        for (prod_id, prod_viernulvier_id) in existing_productions
    }

    existing_halls = db_session.execute(select(Hall.id, Hall.viernulvier_id))
    hall_map: dict[int, int] = {
        hall_viernulvier_id: hall_id
        for (hall_id, hall_viernulvier_id) in existing_halls
    }

    deletes = 0

    for json_event in events:
        try:
            updated_event, viernulvier_prod_id, viernulvier_hall_id = (
                api_event_to_model_event(json_event)
            )

            existing_event: Event = db_session.scalar(
                select(Event).where(
                    Event.viernulvier_id == updated_event.viernulvier_id
                )
            )

            # Drop unknown events
            if not existing_event:
                continue

            # Check if the event is tied to a valid production, else we would get a
            # ForeignKey violation
            if not viernulvier_prod_id or viernulvier_prod_id not in prod_map:
                logger.warning(
                    f"[UPDATE] Deleting stored event (viernulvier_id="
                    f"{updated_event.viernulvier_id}) because its link to a production "
                    "was removed"
                )
                db_session.delete(existing_event)
                deletes += 1
                continue

            # Update production if needed
            internal_prod_id = prod_map.get(viernulvier_prod_id)
            if internal_prod_id != existing_event.production_id:
                logger.info(
                    f"[UPDATE] viernulvier_production_id changed from "
                    f"'{existing_event.production.viernulvier_id}' to "
                    f"'{viernulvier_prod_id}' "
                    f"for Event(viernulvier_id={existing_event.viernulvier_id})"
                )
                existing_event.production_id = internal_prod_id

            # Update hall if needed
            if viernulvier_hall_id:
                internal_hall_id = hall_map.get(viernulvier_hall_id)
                if not internal_hall_id:
                    logger.warning(
                        f"[UPDATE] Event "
                        f"(viernulvier_id={updated_event.viernulvier_id}) "
                        f"references hall with viernulvier_id={viernulvier_hall_id}"
                        ", but this hall does not exist in the database. "
                        "Not updating the hall for this event."
                    )
                elif internal_hall_id != existing_event.hall_id:
                    old_hall_vnv_id = (
                        existing_event.hall.viernulvier_id
                        if existing_event.hall
                        else None
                    )
                    logger.info(
                        f"[UPDATE] viernulvier_hall_id changed from "
                        f"'{old_hall_vnv_id}' to '{viernulvier_hall_id}' "
                        f"for Event(viernulvier_id={existing_event.viernulvier_id})"
                    )
                    existing_event.hall_id = old_hall_vnv_id
            elif existing_event.hall_id:
                logger.info(
                    f"[UPDATE] hall for "
                    f"Event(viernulvier_id={existing_event.viernulvier_id})"
                    f" was deleted, deleting the reference to "
                    f"Hall(viernulvier_id={existing_event.hall.viernulvier_id})"
                )
                existing_event.hall_id = None

            sync_simple_fields(
                existing_event,
                updated_event,
                ["starts_at", "ends_at", "order_url"],
                "Event",
            )

            # No need to call db_session.merge(), it already is updated by
            # sqlalchemy

            updated_at_str = json_event.get("updated_at")
            if updated_at_str:
                updated_at = datetime.fromisoformat(updated_at_str)
                if newest_timestamp is None or updated_at > newest_timestamp:
                    newest_timestamp = updated_at

        except Exception as e:
            logger.error(f"Error updating event ({json_event}):\n{e}")

    if deletes > 2:
        logger.warning(
            f"[UPDATE] Deleted {deletes} events due to no valid production_id"
        )

    return newest_timestamp
