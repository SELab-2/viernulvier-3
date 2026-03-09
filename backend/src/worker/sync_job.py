import logging

from sqlalchemy import select
from datetime import datetime
from sqlalchemy.orm import Session
from src.database import SESSION_LOCAL
from src.models.language import Language
from src.models.sync_state import ResourceType, SyncState, SyncType
from src.worker.api_to_model.production import api_prod_to_model_prod
from src.worker.api_wrapper.production import ProductionFetcher
from src.worker.api_wrapper.vnv_wrapper import VNV_Wrapper

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


def get_last_sync(db, resource_type: ResourceType, sync_type: SyncType):
    query = select(SyncState).where(
        SyncState.resource == resource_type,
        SyncState.sync_type == sync_type,
    )

    result = db.execute(query).scalar_one_or_none()

    logger.debug(f"get_last_sync({resource_type}, {sync_type}) -> {result}")

    if result:
        return result.last_timestamp

    return None


def update_sync_state(db, resource: ResourceType, sync_type: SyncType, new_timestamp):
    state = (
        db.query(SyncState)
        .filter_by(resource=resource, sync_type=sync_type)
        .one_or_none()
    )

    assert state is not None
    state.last_timestamp = new_timestamp

    logger.debug(f"update_sync_state({resource}, {sync_type}) updates state {state}")

    # No commit, happens inside the `sync_new_xxx()` so it commits together
    # with the actual new data


def sync_new_productions(
    session: Session, language_map: dict[str, int], fetcher: ProductionFetcher
):
    last_timestamp = get_last_sync(
        session, ResourceType.PRODUCTION, SyncType.CREATED_AT
    )

    # TODO: do this in a try-catch block with corresponding error handling
    productions = fetcher.get_new_productions_after(last_timestamp)
    logger.info(f"fetched {len(productions)} from API")

    if not productions:
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
    lang_map = get_language_map(db)

    try:
        with VNV_Wrapper() as wrapper:
            prod_fetcher = ProductionFetcher(wrapper)
            sync_new_productions(db, lang_map, prod_fetcher)
    finally:
        db.close()
