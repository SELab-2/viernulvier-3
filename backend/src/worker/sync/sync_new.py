import logging
import types

from sqlalchemy.orm import Session
from src.models.sync_state import ResourceType, SyncType
from src.worker.fetchers.paged_fetcher import PagedFetcher
from src.worker.sync.db_sync import get_last_sync, update_sync_state
from src.worker.sync.store.event import store_new_events
from src.worker.sync.store.eventprice import store_new_eventprices
from src.worker.sync.store.production import store_new_productions
from src.worker.sync.store.tag import store_new_tags
from src.worker.sync.store.genre import store_new_genres

logger = logging.getLogger(__name__)


STORE_FUNCTIONS: dict[ResourceType, types.FunctionType] = {
    ResourceType.PRODUCTION: store_new_productions,
    ResourceType.EVENT: store_new_events,
    ResourceType.EVENT_PRICES: store_new_eventprices,
    ResourceType.TAGS: store_new_tags,
    ResourceType.GENRES: store_new_genres,
}


def store_new_items(
    db_session: Session,
    resource_type: ResourceType,
    items: list[dict],
):
    """
    Generic function that calls the correct function based on `resource_type`.

    ---

    :returns: the newest timestamp
    :raises ValueError: when there is no store function for the given `resource_type`
    """
    store_fn = STORE_FUNCTIONS.get(resource_type)
    if not store_fn:
        raise ValueError(f"No store function registered for {resource_type}")

    return store_fn(db_session, items)


def sync_new_items(
    db_session: Session,
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
    :param fetcher: a fetcher inhereting from PagedFetcher for getting new data
    :param resource_type: type of resource to look up in database
    """
    last_timestamp = get_last_sync(db_session, resource_type, SyncType.CREATED_AT)

    items = []
    try:
        items = fetcher.get_new_items_after(last_timestamp)
    except ConnectionError:
        if fetcher.has_partial_data():
            items = fetcher.get_and_clear_partial_data()

    logger.info(f"fetched {len(items)} new {resource_type.value}(s) from API")

    if not items or len(items) == 0:
        return

    newest_timestamp = store_new_items(db_session, resource_type, items)
    if not newest_timestamp:
        newest_timestamp = last_timestamp

    update_sync_state(db_session, resource_type, SyncType.CREATED_AT, newest_timestamp)

    db_session.commit()
    logger.debug(f"committed sync_new_items({resource_type.value})")
