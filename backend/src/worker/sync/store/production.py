from datetime import datetime

from sqlalchemy.orm import Session
from src.worker.converters.production import api_prod_to_model_prod


def store_new_productions(
    db_session: Session, language_map: dict[str, int], productions: list[dict]
):
    newest_timestamp = None

    for json_prod in productions:
        prod, prod_info = api_prod_to_model_prod(json_prod, language_map)
        db_session.merge(prod)

        for info in prod_info:
            db_session.merge(info)

        created_at = datetime.fromisoformat(json_prod["created_at"])
        if newest_timestamp is None or created_at > newest_timestamp:
            newest_timestamp = created_at

    return newest_timestamp
