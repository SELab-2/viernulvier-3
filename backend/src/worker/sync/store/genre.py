from datetime import datetime
from sqlalchemy.orm import Session
from src.worker.converters.genres import api_genre_to_model_tag


def store_new_genres(db_session: Session, genres: list[dict]):
    newest_timestamp = None

    for json_genre in genres:
        tag, tag_names = api_genre_to_model_tag(json_genre)
        merged_tag = db_session.merge(tag)
        db_session.flush()
        db_session.refresh(merged_tag)

        for tag_name in tag_names:
            db_session.merge(tag_name)

        db_session.flush()

        created_at = datetime.fromisoformat(json_genre["created_at"])
        if newest_timestamp is None or created_at > newest_timestamp:
            newest_timestamp = created_at

    return newest_timestamp
