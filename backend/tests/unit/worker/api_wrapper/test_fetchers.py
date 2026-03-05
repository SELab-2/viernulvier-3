"""
This file will lightly test the ProductionFetcher, EventFetcher, ...
As they rely on PagedFetcher, which has its own tests, there aren't a lot
of tests needed, only that the right function gets called with the right
parameter.
"""

from unittest.mock import MagicMock
from src.worker.api_wrapper.production import ProductionFetcher
from src.worker.api_wrapper.event import EventFetcher


# Only this top function has comments explaining steps, the rest is
# basically copy-paste with changing some names.
def test_get_new_productions_after_calls_fetch_all():
    fetcher = ProductionFetcher(vnv_wrapper=MagicMock())

    # Override the fetch_all() method that was inherited
    fetcher.fetch_all = MagicMock(return_value=["data"])

    result = fetcher.get_new_productions_after("2024-01-01")

    # Check if the overriden method was called exactly once
    fetcher.fetch_all.assert_called_once_with(
        "/productions", {"created_at[after]": "2024-01-01"}
    )

    assert result == ["data"]


def test_get_new_events_after_calls_fetch_all():
    fetcher = EventFetcher(vnv_wrapper=MagicMock())
    fetcher.fetch_all = MagicMock(return_value=["data"])
    result = fetcher.get_new_events_after("2024-01-01")
    fetcher.fetch_all.assert_called_once_with(
        "/events", {"created_at[after]": "2024-01-01"}
    )
    assert result == ["data"]
