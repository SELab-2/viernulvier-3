from src.worker.fetchers.paged_fetcher import PagedFetcher


class ProductionFetcher(PagedFetcher):
    """
    This class stands in for fetching productions from the viernulvier API.

    Its init takes in a `VNV_Wrapper` which will be used to execute all
    requests, and has a `get_new_items_after(timestamp)` to request all
    productions.
    """

    endpoint = "/productions"
