from datetime import datetime
from sqlalchemy.orm import Session
from src.worker.converters.tag import api_tag_to_model_tag


def store_new_tags(db_session: Session, tags: list[dict]):
    newest_timestamp = None

    for json_tag in tags:
        tag, tag_names = api_tag_to_model_tag(json_tag)
        db_session.merge(tag)

        for tag_name in tag_names:
            db_session.merge(tag_name)

        created_at = datetime.fromisoformat(json_tag["created_at"])
        if newest_timestamp is None or created_at > newest_timestamp:
            newest_timestamp = created_at

    return newest_timestamp
