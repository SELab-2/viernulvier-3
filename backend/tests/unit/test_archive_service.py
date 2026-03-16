from src.services.archive import get_base_url


def test_basic():
    url = "https://example.com/api/v1/users/"
    assert get_base_url(url, 1) == "https://example.com/api/v1"
    assert get_base_url(url, 2) == "https://example.com/api"


def test_no_trailing_slash():
    url = "https://example.com/api/v1/users"
    assert get_base_url(url, 1) == "https://example.com/api/v1"


def test_root_url():
    url = "https://example.com/"
    assert get_base_url(url, 1) == "https://example.com"
