from datetime import datetime

from sqlalchemy.orm import Session
from src.worker.converters.event import api_event_to_model_event


def store_new_events(
    db_session: Session, language_map: dict[str, int], events: list[dict]
):
    newest_timestamp = None

    for json_event in events:
        event = api_event_to_model_event(json_event, language_map)
        db_session.merge(event)

        created_at_str = json_event.get("created_at")
        if created_at_str:
            created_at_str = datetime.fromisoformat(created_at_str)
            if newest_timestamp is None or created_at_str > newest_timestamp:
                newest_timestamp = created_at_str

    return newest_timestamp
