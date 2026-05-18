"""
This is the test file for 'src/worker/sync/sync_updated.py'. That file's main
task is to call the right functions for the given types, more does it not
really do.
To test we make use of mocks and just check if the correct functions are
called.
"""

from datetime import datetime
from unittest.mock import MagicMock

import pytest
import src.worker.sync.sync_updated as sync_updated
from src.models.sync_state import ResourceType
from src.worker.sync.sync_updated import sync_updated_items

OLD_TS = datetime(2024, 1, 1)
NEW_TS = datetime(2024, 1, 5)


def overwrite_functions(monkeypatch):
    """
    Uses pytest's `monkeypatch` function to overwrite complete functions,
    we need that for `store_new_XXX()` functions and `get_last_sync()` and
    `update_sync_state()`.

    The important part here is that we don't overwrite the function where it is
    defined, but where it is used, so use the `src.worker.sync.sync_new`
    namespace!

    Returns the mocked functions so that they can be tested against.
    """
    get_last_sync = MagicMock()
    update_sync_state = MagicMock()

    store_updated_productions = MagicMock(return_value=NEW_TS)
    store_updated_events = MagicMock(return_value=NEW_TS)
    store_updated_eventprices = MagicMock(return_value=NEW_TS)
    store_updated_tags = MagicMock(return_value=NEW_TS)
    store_updated_genres = MagicMock(return_value=NEW_TS)

    monkeypatch.setattr("src.worker.sync.sync_updated.get_last_sync", get_last_sync)
    monkeypatch.setattr(
        "src.worker.sync.sync_updated.update_sync_state", update_sync_state
    )

    monkeypatch.setitem(
        sync_updated.UPDATE_FUNCTIONS,
        ResourceType.PRODUCTION,
        store_updated_productions,
    )
    monkeypatch.setitem(
        sync_updated.UPDATE_FUNCTIONS, ResourceType.EVENT, store_updated_events
    )
    monkeypatch.setitem(
        sync_updated.UPDATE_FUNCTIONS,
        ResourceType.EVENT_PRICES,
        store_updated_eventprices,
    )
    monkeypatch.setitem(
        sync_updated.UPDATE_FUNCTIONS, ResourceType.TAGS, store_updated_tags
    )
    monkeypatch.setitem(
        sync_updated.UPDATE_FUNCTIONS, ResourceType.GENRES, store_updated_genres
    )

    return {
        "get_last_sync": get_last_sync,
        "update_sync_state": update_sync_state,
        "store_updated_productions": store_updated_productions,
        "store_updated_events": store_updated_events,
        "store_updated_eventprices": store_updated_eventprices,
        "store_updated_tags": store_updated_tags,
        "store_updated_genres": store_updated_genres,
    }


# Test all the normal paths to see if the right functions get called
@pytest.mark.parametrize(
    "resource_type,expected_update_fn",
    [
        (ResourceType.PRODUCTION, "store_updated_productions"),
        (ResourceType.EVENT, "store_updated_events"),
        (ResourceType.EVENT_PRICES, "store_updated_eventprices"),
        (ResourceType.TAGS, "store_updated_tags"),
        (ResourceType.GENRES, "store_updated_genres"),
    ],
)
def test_sync_updated_items_dispatch_good_path(
    resource_type, expected_update_fn, monkeypatch
):
    mocks = overwrite_functions(monkeypatch)

    db_session = MagicMock()
    fetcher = MagicMock()
    fetcher.get_updated_items_after.return_value = [{"id": 4}]

    sync_updated_items(db_session, fetcher, resource_type)

    fetcher.get_updated_items_after.assert_called_once()
    mocks["get_last_sync"].assert_called_once()
    mocks["update_sync_state"].assert_called_once()

    for name in [
        "store_updated_productions",
        "store_updated_events",
        "store_updated_eventprices",
    ]:
        if name == expected_update_fn:
            mocks[name].assert_called_once()
        else:
            mocks[name].assert_not_called()


# Test if PagedFetcher partial data gets read on ConnectionError
def test_sync_updated_items_connection_error(monkeypatch):
    _ = overwrite_functions(monkeypatch)

    db_session = MagicMock()
    fetcher = MagicMock()
    fetcher.get_updated_items_after.side_effect = ConnectionError()
    fetcher.has_partial_data.return_value = True
    fetcher.get_and_clear_partial_data.return_value = [{"id": 4}]

    # Type of resource type does not matter here
    sync_updated_items(db_session, fetcher, ResourceType.PRODUCTION)

    fetcher.get_updated_items_after.assert_called_once()
    fetcher.get_and_clear_partial_data.assert_called_once()


# Test if 'sync_new_items' returns early when there are no items
def test_updatedc_new_items_no_data(monkeypatch):
    mocks = overwrite_functions(monkeypatch)

    db_session = MagicMock()
    fetcher = MagicMock()
    fetcher.get_updated_items_after.return_value = []

    # Type of resource type does not matter here
    sync_updated_items(db_session, fetcher, ResourceType.PRODUCTION)

    fetcher.get_updated_items_after.assert_called_once()
    mocks["store_updated_productions"].assert_not_called()
    mocks["update_sync_state"].assert_not_called()


# Test if the old timestamp is used when no new items were fetched
def test_sync_updated_items_falls_back_to_last_timestamp(monkeypatch):
    mocks = overwrite_functions(monkeypatch)

    db_session = MagicMock()
    fetcher = MagicMock()

    fetcher.get_updated_items_after.return_value = [{"id": 4}]

    mocks["get_last_sync"].return_value = OLD_TS
    # Override the `store_new_productions` to act like it stored nothing
    mocks["store_updated_productions"].return_value = None

    sync_updated_items(db_session, fetcher, ResourceType.PRODUCTION)

    mocks["update_sync_state"].assert_called_once_with(
        db_session,
        ResourceType.PRODUCTION,
        sync_updated.SyncType.UPDATED_AT,
        OLD_TS,
    )


# To be 100% complete, also test that unknow resource types will throw so that
# they do not silently fail
def test_sync_new_items_throws_for_unknown_type():
    with pytest.raises(
        ValueError, match="No update function registered for unknown_resource_type"
    ):
        db_session = MagicMock()
        sync_updated.store_updated_items(db_session, "unknown_resource_type", [])
