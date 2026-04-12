from datetime import datetime
from sqlalchemy.orm import Session
from src.worker.converters.genres import api_genre_to_model_tag


def store_new_genres(db_session: Session, genres: list[dict]):
    newest_timestamp = None

    for json_genre in genres:
        tag, tag_names = api_genre_to_model_tag(json_genre)

        for tag_name in tag_names:
            tag.names.append(tag_name)

        db_session.add(tag)
        db_session.flush()

        created_at = datetime.fromisoformat(json_genre["created_at"])
        if newest_timestamp is None or created_at > newest_timestamp:
            newest_timestamp = created_at

    return newest_timestamp
