import logging
from datetime import datetime

from sqlalchemy.orm import Session
from src.worker.converters.hall import api_location_to_model_halls

logger = logging.getLogger(__name__)


def store_new_halls(db_session: Session, halls: list[dict]):
    newest_timestamp = None

    for json_hall in halls:
        try:
            # TODO: this returns a list of halls
            hall = api_location_to_model_halls(json_hall)

            # Valid production id, so store this event
            db_session.merge(hall)

            created_at_str = json_hall.get("created_at")
            if created_at_str:
                created_at_str = datetime.fromisoformat(created_at_str)
                if newest_timestamp is None or created_at_str > newest_timestamp:
                    newest_timestamp = created_at_str

        except Exception as e:
            logger.warning(f"Error storing hall ({json_hall}):\n{e}")

    return newest_timestamp
