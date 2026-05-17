import logging
import types

from sqlalchemy.orm import Session
from src.models.sync_state import ResourceType, SyncType
from src.worker.fetchers.paged_fetcher import PagedFetcher
from src.worker.sync.db_sync import get_last_sync, update_sync_state
from src.worker.sync.update.event import store_updated_events
from src.worker.sync.update.eventprice import store_updated_eventprices
from src.worker.sync.update.genre import store_updated_genres
from src.worker.sync.update.production import store_updated_productions

logger = logging.getLogger(__name__)


UPDATE_FUNCTIONS: dict[ResourceType, types.FunctionType] = {
    ResourceType.PRODUCTION: store_updated_productions,
    ResourceType.EVENT: store_updated_events,
    ResourceType.EVENT_PRICES: store_updated_eventprices,
    ResourceType.GENRES: store_updated_genres,
    ResourceType.HALLS: lambda: (),  # Not implemented
}


def store_updated_items(
    db_session: Session,
    resource_type: ResourceType,
    items: list[dict],
):
    """
    Generic function that calls the correct function based on `resource_type`.

    ---

    :returns: the newest timestamp
    :raises ValueError: when there is no update function for the given `resource_type`
    """
    updated_fn = UPDATE_FUNCTIONS.get(resource_type)
    if not updated_fn:
        raise ValueError(f"No update function registered for {resource_type}")

    return updated_fn(db_session, items)


def sync_updated_items(
    db_session: Session,
    fetcher: PagedFetcher,
    resource_type: ResourceType,
):
    """
    Function that, given a `fetcher` and `resource_type`, will do the
    database lookup for the last sync, perform a new sync, and update the
    database with the updated data and new sync-timestamp.

    WARNING: fetcher and resource_type must be representing the same type

    ---

    :param db_session: open database connection
    :param fetcher: a fetcher inhereting from PagedFetcher for getting new data
    :param resource_type: type of resource to look up in database
    """
    last_timestamp = get_last_sync(db_session, resource_type, SyncType.UPDATED_AT)

    items = []
    try:
        items = fetcher.get_updated_items_after(last_timestamp)
    except ConnectionError:
        if fetcher.has_partial_data():
            items = fetcher.get_and_clear_partial_data()

    logger.info(f"fetched {len(items)} updated {resource_type.value}(s) from API")

    if not items or len(items) == 0:
        return

    newest_timestamp = store_updated_items(db_session, resource_type, items)
    if not newest_timestamp:
        newest_timestamp = last_timestamp

    update_sync_state(db_session, resource_type, SyncType.UPDATED_AT, newest_timestamp)

    db_session.commit()
    logger.debug(f"committed sync_updated_items({resource_type.value})")
