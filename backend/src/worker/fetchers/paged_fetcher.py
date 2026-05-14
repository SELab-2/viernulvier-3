import logging

from src.worker.vnv_wrapper import VNV_Wrapper


class PagedFetcher:
    """
    This class stands in for fetching stuff, potentially in pages,
    from the viernulvier API.

    Its init takes in a `VNV_Wrapper` which will be used to execute all
    requests.
    """

    endpoint = None

    def __init__(self, vnv_wrapper: VNV_Wrapper):
        self.vnv_wrapper = vnv_wrapper
        """
        Viernulvier wrapper used to make the actual requests.
        Can be substituted by a mock implementation for tests.
        """

        self.logger = logging.getLogger(__name__)
        self._paged_data: list | None = None

    def get_new_items_after(self, last_timestamp):
        """
        Get all new items after the given timestamp.

        The timestamp is used **inclusive**, meaning that it probably returns
        an item that already exists in the database.

        When calling the API fails this will throw an error. However,
        if there was already data fetched (f.e. when paging and hitting a
        rate limit), the object will have stored the results which you can
        query with `.has_partial_data()` and `.get_partial_data()`.

        ---

        :param timestamp: used to get new items after (inclusive)
        """
        if self.endpoint is None:
            raise NotImplementedError(
                f"Class {__class__} did not set 'endpoint' and can thus not sync"
            )

        parameters = {"created_at[after]": last_timestamp}
        return self.fetch_all(self.endpoint, parameters)

    def fetch_all(self, link: str, parameters: dict) -> list:
        """
        Fetches all (potentially paginated) data from the API endpoint.

        Assumes that the response is a json object with the keys:
        - `totalItems`: int
        - `member`: list

        Will insert `page` parameter into the passed parameters-dict to
        do the paging.

        ---

        :param parameters: parameters to pass to vnv_wrapper.GET()
        :returns: the paged data
        :raises RuntimeError: when totalItems from API decreases
        :raises ConnectionError: when API returns non-200 status
        """

        page = 1
        params = parameters.copy()
        params["page"] = page

        data = self.vnv_wrapper.GET(link, params)
        total_items = data["totalItems"]

        members = data["member"]
        fetched_count = len(members)
        self._paged_data = members

        PAGE_SIZE = 30
        page_estimation = (total_items + PAGE_SIZE - 1) // PAGE_SIZE
        self.logger.info(
            f"Fetching {total_items} from {link}, estimated {
                page_estimation
            } pages to fetch"
        )

        while fetched_count < total_items:
            page += 1
            params["page"] = page

            data = self.vnv_wrapper.GET(link, params)

            members = data["member"]
            fetched_count += len(members)
            self._paged_data.extend(members)

            new_total_items = data["totalItems"]
            if new_total_items >= total_items:
                total_items = new_total_items
            else:
                # TODO:
                #   if there are less we're in trouble, will have to refetch
                #   everything?
                raise RuntimeError("totalItems decreased during pagination")

        return_val = self._paged_data
        self._paged_data = None
        return return_val

    def has_partial_data(self) -> bool:
        return self._paged_data is not None

    def get_and_clear_partial_data(self) -> list:
        """
        Retrieve and clear the stored partial data.
        """
        return_val = self._paged_data
        self._paged_data = None
        return return_val
