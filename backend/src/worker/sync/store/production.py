from datetime import datetime

from sqlalchemy.orm import Session
from src.worker.converters.production import api_prod_to_model_prod


def store_new_productions(
    db_session: Session, productions: list[dict]
):
    newest_timestamp = None

    for json_prod in productions:
        # The production contains a list of info's with its relation.
        # sqlalchemy should automatically create all the required objects.
        prod = api_prod_to_model_prod(json_prod)
        db_session.merge(prod)

        created_at = datetime.fromisoformat(json_prod["created_at"])
        if newest_timestamp is None or created_at > newest_timestamp:
            newest_timestamp = created_at

    return newest_timestamp
