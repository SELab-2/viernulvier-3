from src.worker.api_wrapper.paged_fetcher import PagedFetcher


class EventFetcher(PagedFetcher):
    """
    This class stands in for fetching productions from the viernulvier API.

    Its init takes in a `VNV_Wrapper` which will be used to execute all
    requests, and has a `get_productions_after(timestamp)` to request all
    productions.
    """

    def get_new_events_after(self, timestamp) -> list:
        """
        Get all events after the given timestamp.

        The timestamp is used **inclusive**, meaning that it probably returns
        an event that already sits in the database.

        When calling the API fails, this will throw an error. However,
        if there was already data fetched (f.e during paging),
        the object will have stored the results which you can
        query with `EventFetcher.has_data()` and
        `EventFetcher.get_data()`.

        :param timestamp: used to get new events after (inclusive)
        """

        parameters = {"created_at[after]": timestamp}
        return self.fetch_all("/events", parameters)
