import logging

from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.sql import select
from src.models.tag import Tag
from src.worker.converters.genres import api_genre_to_model_tag

logger = logging.getLogger(__name__)


def store_new_genres(db_session: Session, genres: list[dict]):
    newest_timestamp = None

    existing_vnv_ids = set(db_session.execute(select(Tag.viernulvier_id)))

    for json_genre in genres:
        try:
            tag = api_genre_to_model_tag(json_genre)

            if tag.viernulvier_id in existing_vnv_ids:
                continue
            else:
                existing_vnv_ids.add(tag.viernulvier_id)

            db_session.add(tag)

            created_at = datetime.fromisoformat(json_genre["created_at"])
            if newest_timestamp is None or created_at > newest_timestamp:
                newest_timestamp = created_at

        except Exception as e:
            logger.warning(f"Error storing genre ({json_genre}):\n{e}")

    return newest_timestamp
