import logging

from datetime import datetime
from sqlalchemy.orm import Session
from src.worker.converters.genres import api_genre_to_model_tag

logger = logging.getLogger(__name__)


def store_new_genres(db_session: Session, genres: list[dict]):
    newest_timestamp = None

    for json_genre in genres:
        try:
            tag, tag_names = api_genre_to_model_tag(json_genre)
            db_session.add(tag)
            db_session.flush()

            for tag_name in tag_names:
                tag_name.tag_id = tag.id
                db_session.add(tag_name)

            db_session.flush()

            created_at = datetime.fromisoformat(json_genre["created_at"])
            if newest_timestamp is None or created_at > newest_timestamp:
                newest_timestamp = created_at

        except Exception as e:
            logger.warning(f"Error storing genre ({json_genre}):\n{e}")

    return newest_timestamp
