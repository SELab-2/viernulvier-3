import logging
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy.sql import select
from src.models.production import Production
from src.worker.converters.event import api_event_to_model_event

logger = logging.getLogger(__name__)


def store_new_events(db_session: Session, events: list[dict]):
    newest_timestamp = None

    existing_productions = db_session.execute(
        select(Production.id, Production.viernulvier_id)
    )
    prod_map: dict[int, int] = {
        prod_viernulvier_id: prod_id
        for (prod_id, prod_viernulvier_id) in existing_productions
    }

    orphans = 0

    for json_event in events:
        event, viernulvier_prod_id = api_event_to_model_event(json_event)

        # Check if the event is tied to a valid production, else we would get a
        # ForeignKey violation
        if not viernulvier_prod_id:
            logger.warning(
                f"Not storing event (id={event.viernulvier_id}) because no "
                "associated production"
            )
            orphans += 1
            continue

        internal_prod_id = prod_map.get(viernulvier_prod_id)

        if not internal_prod_id:
            logger.warning(
                f"Not storing event (id={event.viernulvier_id}) because the "
                f"associated production (id={viernulvier_prod_id}) does not "
                "exist (anymore)"
            )
            orphans += 1
            continue

        event.production_id = internal_prod_id

        # Valid production id, so store this event
        db_session.merge(event)

        created_at_str = json_event.get("created_at")
        if created_at_str:
            created_at_str = datetime.fromisoformat(created_at_str)
            if newest_timestamp is None or created_at_str > newest_timestamp:
                newest_timestamp = created_at_str

    if orphans > 2:
        logger.warning(f"Skipped {orphans} events due to no valid production_id")

    return newest_timestamp
