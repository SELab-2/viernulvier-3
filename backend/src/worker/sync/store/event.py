import logging
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy.sql import select
from src.models.production import Production
from src.worker.converters.event import api_event_to_model_event

logger = logging.getLogger(__name__)


def store_new_events(
    db_session: Session, language_map: dict[str, int], events: list[dict]
):
    newest_timestamp = None

    existing_productions = set(db_session.execute(select(Production.id)).scalars())
    orphans = 0

    for json_event in events:
        event = api_event_to_model_event(json_event)

        # Check if the event is tied to a valid production, else we would get a
        # ForeignKey violation
        if not event.production_id:
            logger.warning(
                f"Not storing event (id={event.id}) because no associated production"
            )
            orphans += 1

        elif event.production_id not in existing_productions:
            logger.warning(
                f"Not storing event (id={event.id}) because the associated "
                f"production (id={event.production_id}) does not exist (anymore)"
            )
            orphans += 1

        # Valid production id, so store this event
        else:
            db_session.merge(event)

        created_at_str = json_event.get("created_at")
        if created_at_str:
            created_at_str = datetime.fromisoformat(created_at_str)
            if newest_timestamp is None or created_at_str > newest_timestamp:
                newest_timestamp = created_at_str

    if orphans > 2:
        logger.warning(f"Skipped {orphans} events due to no valid production_id")

    return newest_timestamp
