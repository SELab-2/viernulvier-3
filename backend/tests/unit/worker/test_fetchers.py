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
from src.worker.fetchers.tags import TagFetcher
from src.worker.fetchers.gallery import GalleryFetcher


@pytest.mark.parametrize(
    "fetcher_class, endpoint",
    [
        (ProductionFetcher, "/productions"),
        (EventFetcher, "/events"),
        (EventPriceFetcher, "/events/prices"),
        (HallFetcher, "/halls"),
        (GenreFetcher, "/genres"),
        (TagFetcher, "/tags"),
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
