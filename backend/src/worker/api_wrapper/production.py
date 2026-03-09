from src.worker.api_wrapper.paged_fetcher import PagedFetcher


class ProductionFetcher(PagedFetcher):
    """
    This class stands in for fetching productions from the viernulvier API.

    Its init takes in a `VNV_Wrapper` which will be used to execute all
    requests, and has a `get_new_productions_after(timestamp)` to request all
    productions.
    """

    def get_new_productions_after(self, timestamp) -> list:
        """
        Get all productions after the given timestamp.

        The timestamp is used **inclusive**, meaning that it probably returns
        a production that already exists in the database.

        When calling the API fails this will throw an error. However,
        if there was already data fetched (f.e. when paging and hitting a
        rate limit), the object will have stored the results which you can
        query with `.has_data()` and `.get_data()`.

        ---

        :param timestamp: used to get new productions after (inclusive)
        """

        parameters = {"created_at[after]": timestamp}
        return self.fetch_all("/productions", parameters)
