"""
This file will lightly test the ProductionFetcher, EventFetcher, ...
As they rely on PagedFetcher, which has its own tests, there aren't a lot
of tests needed, only that the right function gets called with the right
parameter.
"""

import pytest

from unittest.mock import MagicMock
from src.worker.api_wrapper.production import ProductionFetcher
from src.worker.api_wrapper.event import EventFetcher
from src.worker.api_wrapper.event_prices import EventPriceFetcher
from src.worker.api_wrapper.halls import HallFetcher
from src.worker.api_wrapper.genres import GenreFetcher
from src.worker.api_wrapper.tags import TagFetcher
from src.worker.api_wrapper.gallery import GalleryFetcher


@pytest.mark.parametrize(
    "fetcher_class, method_name, endpoint",
    [
        (ProductionFetcher, "get_new_productions_after", "/productions"),
        (EventFetcher, "get_new_events_after", "/events"),
        (EventPriceFetcher, "get_new_prices_after", "/events/prices"),
        (HallFetcher, "get_new_halls_after", "/halls"),
        (GenreFetcher, "get_new_genres_after", "/genres"),
        (TagFetcher, "get_new_tags_after", "/tags"),
        (GalleryFetcher, "get_new_galleries_after", "/media/galleries"),
    ],
)
def test_get_new_after_calls_fetch_all(fetcher_class, method_name, endpoint):
    fetcher = fetcher_class(vnv_wrapper=MagicMock())

    # Override the fetch_all() method that was inherited
    fetcher.fetch_all = MagicMock(return_value=["data"])

    fetch_method = getattr(fetcher, method_name)
    result = fetch_method("2024-01-01")

    # Check if the overriden method was called exactly once
    fetcher.fetch_all.assert_called_once_with(
        endpoint, {"created_at[after]": "2024-01-01"}
    )

    assert result == ["data"]
