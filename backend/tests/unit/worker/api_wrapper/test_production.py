import pytest
from unittest.mock import MagicMock

from src.worker.api_wrapper.production import ProductionFetcher


def test_single_page_fetch():
    mock_wrapper = MagicMock()

    # ProductionFetcher does not check the contents really, so we can use
    # very simple productions here.
    mock_wrapper.GET.return_value = {
        "totalItems": 2,
        "member": [{"id": 1}, {"id": 2}],
    }

    fetcher = ProductionFetcher(mock_wrapper)

    result = fetcher.get_new_productions_after("2024-01-01")

    assert result == [{"id": 1}, {"id": 2}]
    assert mock_wrapper.GET.call_count == 1
    assert fetcher.has_data() is False


def test_multi_page_fetch():
    mock_wrapper = MagicMock()

    mock_wrapper.GET.side_effect = [
        {
            "totalItems": 3,
            "member": [{"id": 1}, {"id": 2}],
        },
        {
            "totalItems": 3,
            "member": [{"id": 3}],
        },
    ]

    fetcher = ProductionFetcher(mock_wrapper)

    result = fetcher.get_new_productions_after("2024-01-01")

    assert result == [{"id": 1}, {"id": 2}, {"id": 3}]
    assert mock_wrapper.GET.call_count == 2


def test_connection_error_on_first_call():
    mock_wrapper = MagicMock()
    mock_wrapper.GET.side_effect = ConnectionError("API down")

    fetcher = ProductionFetcher(mock_wrapper)

    with pytest.raises(ConnectionError):
        fetcher.get_new_productions_after("2024-01-01")

    assert fetcher.has_data() is False


def test_partial_data_retained_on_error():
    mock_wrapper = MagicMock()

    mock_wrapper.GET.side_effect = [
        {
            "totalItems": 3,
            "member": [{"id": 1}, {"id": 2}],
        },
        ConnectionError("Rate limit hit"),
    ]

    fetcher = ProductionFetcher(mock_wrapper)

    with pytest.raises(ConnectionError):
        fetcher.get_new_productions_after("2024-01-01")

    assert fetcher.has_data() is True
    assert fetcher.get_data() == [{"id": 1}, {"id": 2}]


def test_total_items_decreases_error():
    mock_wrapper = MagicMock()

    mock_wrapper.GET.side_effect = [
        {
            "totalItems": 3,
            "member": [{"id": 1}, {"id": 2}],
        },
        {
            "totalItems": 1,  # decreasing!
            "member": [{"id": 3}],
        },
    ]

    fetcher = ProductionFetcher(mock_wrapper)

    with pytest.raises(RuntimeError):
        fetcher.get_new_productions_after("2024-01-01")
