from urllib.parse import urlparse, urlunparse


def get_base_url(url: str, remove_last_segments: int = 1) -> str:
    """
    Returns the base URL by removing a specified number of path segments from the end.

    Examples:
        >>> get_base_url("https://example.com/api/v1/users/", 1)
        'https://example.com/api/v1'
        >>> get_base_url("https://example.com/api/v1/users/", 2)
        'https://example.com/api'
        >>> get_base_url("https://example.com/api/v1/archive/productions/?cursor=1&limit=20", 1)
        'https://example.com/api/v1/archive'
    """
    parsed = urlparse(url)

    path_segments = parsed.path.rstrip("/").split("/")

    new_path = "/".join(path_segments[:-remove_last_segments])
    # new_url = urlunparse(parsed._replace(path=new_path))
    new_url = urlunparse(
        parsed._replace(
            path=new_path,
            params="",
            query="",
            fragment="",
        )
    )
    return new_url
