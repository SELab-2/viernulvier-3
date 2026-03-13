"""
This is the test file for 'src/worker/sync/sync_new.py'. That file's main task
is to call the right functions for the given types, more does it not really
do.
To test we make use of mocks and just check if the correct functions are
called.
"""

from datetime import datetime
from unittest.mock import MagicMock

import pytest
import src.worker.sync.sync_new as sync_new
from src.models.sync_state import ResourceType
from src.worker.sync.sync_new import sync_new_items

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

    store_new_productions = MagicMock(return_value=NEW_TS)
    store_new_events = MagicMock(return_value=NEW_TS)
    store_new_eventprices = MagicMock(return_value=NEW_TS)
    store_new_tags = MagicMock(return_value=NEW_TS)

    monkeypatch.setattr("src.worker.sync.sync_new.get_last_sync", get_last_sync)
    monkeypatch.setattr("src.worker.sync.sync_new.update_sync_state", update_sync_state)

    monkeypatch.setitem(
        sync_new.STORE_FUNCTIONS, ResourceType.PRODUCTION, store_new_productions
    )
    monkeypatch.setitem(sync_new.STORE_FUNCTIONS, ResourceType.EVENT, store_new_events)
    monkeypatch.setitem(
        sync_new.STORE_FUNCTIONS, ResourceType.EVENT_PRICES, store_new_eventprices
    )
    monkeypatch.setitem(sync_new.STORE_FUNCTIONS, ResourceType.TAGS, store_new_tags)

    return {
        "get_last_sync": get_last_sync,
        "update_sync_state": update_sync_state,
        "store_new_productions": store_new_productions,
        "store_new_events": store_new_events,
        "store_new_eventprices": store_new_eventprices,
        "store_new_tags": store_new_tags,
    }


# Test all the normal paths to see if the right functions get called
@pytest.mark.parametrize(
    "resource_type,expected_store_fn",
    [
        (ResourceType.PRODUCTION, "store_new_productions"),
        (ResourceType.EVENT, "store_new_events"),
        (ResourceType.EVENT_PRICES, "store_new_eventprices"),
        (ResourceType.TAGS, "store_new_tags"),
    ],
)
def test_sync_new_items_dispatch_good_path(
    resource_type, expected_store_fn, monkeypatch
):
    mocks = overwrite_functions(monkeypatch)

    db_session = MagicMock()
    fetcher = MagicMock()
    fetcher.get_new_items_after.return_value = [{"id": 4}]

    sync_new_items(db_session, {}, fetcher, resource_type)

    fetcher.get_new_items_after.assert_called_once()
    mocks["get_last_sync"].assert_called_once()
    mocks["update_sync_state"].assert_called_once()

    for name in [
        "store_new_productions",
        "store_new_events",
        "store_new_eventprices",
    ]:
        if name == expected_store_fn:
            mocks[name].assert_called_once()
        else:
            mocks[name].assert_not_called()


# Test if PagedFetcher partial data gets read on ConnectionError
def test_sync_new_items_connection_error(monkeypatch):
    _ = overwrite_functions(monkeypatch)

    db_session = MagicMock()
    fetcher = MagicMock()
    fetcher.get_new_items_after.side_effect = ConnectionError()
    fetcher.has_partial_data.return_value = True
    fetcher.get_and_clear_partial_data.return_value = [{"id": 4}]

    # Type of resource type does not matter here
    sync_new_items(db_session, {}, fetcher, ResourceType.PRODUCTION)

    fetcher.get_new_items_after.assert_called_once()
    fetcher.get_and_clear_partial_data.assert_called_once()


# Test if 'sync_new_items' returns early when there are no items
def test_sync_new_items_no_data(monkeypatch):
    mocks = overwrite_functions(monkeypatch)

    db_session = MagicMock()
    fetcher = MagicMock()
    fetcher.get_new_items_after.return_value = []

    # Type of resource type does not matter here
    sync_new_items(db_session, {}, fetcher, ResourceType.PRODUCTION)

    fetcher.get_new_items_after.assert_called_once()
    mocks["store_new_productions"].assert_not_called()
    mocks["update_sync_state"].assert_not_called()
