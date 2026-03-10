import logging

from sqlalchemy.orm import Session
from src.models.sync_state import ResourceType, SyncType
from src.worker.fetchers.paged_fetcher import PagedFetcher
from src.worker.sync.db_sync import get_last_sync, update_sync_state
from src.worker.sync.store.production import store_new_productions
from src.worker.sync.store.event import store_new_events

logger = logging.getLogger(__name__)


def store_new_items(
    db_session: Session,
    language_map: dict[str, int],
    resource_type: ResourceType,
    items: list[dict],
):
    """
    Generic function that calls the correct function based on `resource_type`.

    ---

    :returns: the newest timestamp
    """
    if resource_type == ResourceType.PRODUCTION:
        return store_new_productions(db_session, language_map, items)
    elif resource_type == ResourceType.EVENT:
        return store_new_events(db_session, language_map, items)


def sync_new_items(
    db_session: Session,
    language_map: dict[str, int],
    fetcher: PagedFetcher,
    resource_type: ResourceType,
):
    """
    Function that, given a `fetcher` and `resource_type`, will do the
    database lookup for the last sync, perform a new sync, and update the
    database with the new data and new sync-timestamp.

    WARNING: fetcher and resource_type must be representing the same type

    ---

    :param db_session: open database connection
    :param language_map: dictionary containing lang-code -> lang-id mapping
    :param fetcher: a fetcher inhereting from PagedFetcher for getting new data
    :param resource_type: type of resource to look up in database
    """
    last_timestamp = get_last_sync(db_session, resource_type, SyncType.CREATED_AT)

    items = []
    try:
        items = fetcher.get_new_productions_after(last_timestamp)
    except ConnectionError:
        if fetcher.has_partial_data():
            items = fetcher.get_and_clear_partial_data()

    logger.info(f"fetched {len(items)} new {resource_type.value}(s) from API")

    if not items or len(items) == 0:
        return

    newest_timestamp = store_new_items(db_session, language_map, resource_type, items)
    if not newest_timestamp:
        newest_timestamp = last_timestamp

    update_sync_state(db_session, resource_type, SyncType.CREATED_AT, newest_timestamp)

    db_session.commit()
    logger.debug(f"committed sync_new_items({resource_type.value})")
