"""
This file will lightly test the ProductionFetcher, EventFetcher, ...
As they rely on PagedFetcher, which has its own tests, there aren't a lot
of tests needed, only that the right function gets called with the right
parameter.
"""

import pytest

from unittest.mock import MagicMock
from src.worker.fetchers.production import ProductionFetcher
from src.worker.fetchers.event import EventFetcher
from src.worker.fetchers.eventprice import EventPriceFetcher
from src.worker.fetchers.halls import HallFetcher
from src.worker.fetchers.genres import GenreFetcher
from src.worker.fetchers.gallery import GalleryFetcher


@pytest.mark.parametrize(
    "fetcher_class, endpoint",
    [
        (ProductionFetcher, "/productions"),
        (EventFetcher, "/events"),
        (EventPriceFetcher, "/events/prices"),
        (GenreFetcher, "/genres"),
        (GalleryFetcher, "/media/galleries"),
    ],
)
def test_get_new_after_calls_fetch_all(fetcher_class, endpoint):
    fetcher = fetcher_class(vnv_wrapper=MagicMock())

    # Override the fetch_all() method that was inherited
    fetcher.fetch_all = MagicMock(return_value=["data"])

    result = fetcher.get_new_items_after("2024-01-01")

    # Check if the overriden method was called exactly once
    fetcher.fetch_all.assert_called_once_with(
        endpoint, {"created_at[after]": "2024-01-01"}
    )

    assert result == ["data"]


def test_hall_fetcher_resolves_locations():
    wrapper = MagicMock()

    fetcher = HallFetcher(vnv_wrapper=wrapper)

    # Mock paged result
    locations = [
        {"@id": "/api/v1/locations/1"},
        {"@id": "/api/v1/locations/2"},
    ]

    fetcher.fetch_all = MagicMock(return_value=locations)

    # Mock deep fetch responses
    wrapper.GET.side_effect = [
        {"id": 1, "name": "Hall 1"},
        {"id": 2, "name": "Hall 2"},
    ]

    result = fetcher.get_new_items_after("2024-01-01")

    # fetch_all called correctly
    fetcher.fetch_all.assert_called_once_with(
        "/locations", {"created_at[after]": "2024-01-01"}
    )

    # deep fetch called per location
    assert wrapper.GET.call_count == 2

    wrapper.GET.assert_any_call("locations/1", {})
    wrapper.GET.assert_any_call("locations/2", {})

    # final result is resolved data
    assert result == [
        {"id": 1, "name": "Hall 1"},
        {"id": 2, "name": "Hall 2"},
    ]


def test_hall_fetcher_partial_data():
    wrapper = MagicMock()
    fetcher = HallFetcher(vnv_wrapper=wrapper)

    # Simulate partial paged data
    fetcher._paged_data = [
        {"@id": "/api/v1/locations/1"},
    ]
    assert fetcher.has_partial_data()

    wrapper.GET.return_value = {"id": 1}

    result = fetcher.get_and_clear_partial_data()

    assert result == [{"id": 1}]
    assert not fetcher.has_partial_data()


def test_hall_fetcher_skips_failed_resolution(caplog):
    wrapper = MagicMock()
    fetcher = HallFetcher(vnv_wrapper=wrapper)

    locations = [
        {"@id": "/api/v1/locations/1"},
        {"@id": "/api/v1/locations/2"},
    ]

    fetcher.fetch_all = MagicMock(return_value=locations)

    def side_effect(path, _):
        if path == "locations/1":
            raise RuntimeError("boom")
        return {"id": 2}

    wrapper.GET.side_effect = side_effect

    result = fetcher.get_new_items_after("2024-01-01")

    # Only successful one is returned
    assert result == [{"id": 2}]

    # Warning logged
    assert (
        "Error when resolving location ({'@id': '/api/v1/locations/1'}):"
        in caplog.messages[0]
    )
