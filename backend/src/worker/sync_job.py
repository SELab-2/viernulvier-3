import logging
from datetime import datetime

from src.worker.sync.db_sync import get_last_sync, update_sync_state
from sqlalchemy.orm import Session
from src.database import SESSION_LOCAL
from src.models.language import Language
from src.models.sync_state import ResourceType, SyncType
from src.worker.converters.production import api_prod_to_model_prod
from src.worker.fetchers.production import ProductionFetcher
from src.worker.vnv_wrapper import VNV_Wrapper

# Logging is used in the other classes, but seeing as this file is the main
# one, setting the config here feels appropriate.
# Currently it logs to stdout, but when this script runs periodically
# we might want to save it to a file.
logging.basicConfig(
    # filename="sync_job.log", filemode="w",
    level=logging.DEBUG,
    format="[%(levelname)s %(asctime)s] %(message)s",
)

logger = logging.getLogger(__name__)


def sync_new_productions(
    session: Session, language_map: dict[str, int], fetcher: ProductionFetcher
):
    last_timestamp = get_last_sync(
        session, ResourceType.PRODUCTION, SyncType.CREATED_AT
    )

    productions = []
    try:
        productions = fetcher.get_new_productions_after(last_timestamp)
    except ConnectionError:
        if fetcher.has_partial_data():
            productions = fetcher.get_and_clear_partial_data()

    logger.info(f"fetched {len(productions)} new production(s) from API")

    if not productions or len(productions) == 0:
        return

    newest_timestamp = last_timestamp

    for json_prod in productions:
        prod, prod_info = api_prod_to_model_prod(json_prod, language_map)
        session.merge(prod)

        for info in prod_info:
            session.merge(info)

        created_at = datetime.fromisoformat(json_prod["created_at"])
        if created_at > newest_timestamp:
            newest_timestamp = created_at

    update_sync_state(
        session, ResourceType.PRODUCTION, SyncType.CREATED_AT, newest_timestamp
    )

    session.commit()
    logger.debug("committed sync_new_productions")


# HACK: this will not be necessary anymore when we store languages by their
#       code instead of by id
def get_language_map(db_session: Session) -> dict[str, int]:
    languages = db_session.query(Language).all()
    return {lang.language: lang.id for lang in languages}


if __name__ == "__main__":
    # This code does not do anything productive yet, but is here to kinda show
    # how the classes inside `api_wrapper/` can be used.

    db = SESSION_LOCAL()
    logger.info("connection with database created")
    lang_map = get_language_map(db)

    try:
        with VNV_Wrapper() as wrapper:
            prod_fetcher = ProductionFetcher(wrapper)
            sync_new_productions(db, lang_map, prod_fetcher)
    finally:
        db.close()
        logger.info("connection with database closed")
