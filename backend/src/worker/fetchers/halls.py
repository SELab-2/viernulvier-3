from src.worker.fetchers.paged_fetcher import PagedFetcher


class HallFetcher(PagedFetcher):
    """
    This class stands in for fetching halls from the viernulvier API.

    Its init takes in a `VNV_Wrapper` which will be used to execute all
    requests, and has a `get_new_items_after(timestamp)` to request all
    halls.
    """

    def get_new_items_after(self, timestamp) -> list:
        """
        Get all halls after the given timestamp.

        The timestamp is used **inclusive**, meaning that it probably returns
        a hall that already exists in the database.

        When calling the API fails this will throw an error. However,
        if there was already data fetched (f.e. when paging and hitting a
        rate limit), the object will have stored the results which you can
        query with `.has_partial_data()` and `.get_partial_data()`.

        ---

        :param timestamp: used to get new halls after (inclusive)
        """

        parameters = {"created_at[after]": timestamp}
        locations = self.fetch_all("/locations", parameters)
        return self.resolve_locations(locations)

    def get_and_clear_partial_data(self) -> list[dict]:
        """
        Retrieve and clear the stored partial data.
        """
        locations = self._paged_data
        self._paged_data = None

        return self.resolve_locations(locations)

    def resolve_location(self, location: dict) -> dict:
        path = location["@id"].lstrip("/api/v1/")
        resolved_location = self.vnv_wrapper.GET(path, {})
        self.logger.debug(f"Resolved location '{path}' to:\n{resolved_location}")
        return resolved_location

    def resolve_locations(self, locations: list[dict]) -> list[dict]:
        resolved_locations = []
        for location in locations:
            try:
                resolved_locations.append(self.resolve_location(location))
            except RuntimeError as e:
                self.logger.warning(f"Error when resolving location ({location}):\n{e}")

        return resolved_locations
