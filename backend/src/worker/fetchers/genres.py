from src.worker.fetchers.paged_fetcher import PagedFetcher


class GenreFetcher(PagedFetcher):
    """
    This class stands in for fetching genres from the viernulvier API.

    Its init takes in a `VNV_Wrapper` which will be used to execute all
    requests, and has a `get_new_genres_after(timestamp)` to request all
    genres.
    """

    def get_new_genres_after(self, timestamp) -> list:
        """
        Get all genres after the given timestamp.

        The timestamp is used **inclusive**, meaning that it probably returns
        a genre that already exists in the database.

        When calling the API fails this will throw an error. However,
        if there was already data fetched (f.e. when paging and hitting a
        rate limit), the object will have stored the results which you can
        query with `.has_data()` and `.get_data()`.

        ---

        :param timestamp: used to get new genres after (inclusive)
        """

        parameters = {"created_at[after]": timestamp}
        return self.fetch_all("/genres", parameters)
