from src.worker.api_wrapper.vnv_wrapper import VNV_Wrapper


class ProductionFetcher:
    """
    This class stands in for fetching productions from the viernulvier API.

    Its init takes in a `VNV_Wrapper` which will be used to execute all
    requests, and has a `get_productions_after(timestamp)` to request all
    productions.
    """

    def __init__(self, vnv_wrapper: VNV_Wrapper):
        self.vnv_wrapper = vnv_wrapper
        """
        Viernulvier wrapper used to make the actual requests.
        Can be substituted by a mock implementation for tests.
        """

        # See docstring of ProductionFetcher.get_productions_after() for why
        # this exists
        # TODO: mss geen extra state bijhouden maar wel of er nog data te gaan
        #   is, en pagina per pagina al direct in de databank steken.
        #   Dat is beter als het gaat om enorme hoeveelheden data die we
        #   mogelijks niet volledig in memory kunnen houden.
        self._data: list | None = None

    def get_new_productions_after(self, timestamp) -> list:
        """
        Get all productions after the given timestamp.

        The timestamp is used **inclusive**, meaning that it probably returns
        a production that already sits in the database.

        When calling the API fails this will throw an error. However,
        if there was already data fetched (f.e. when paging and hitting a
        rate limit), the object will have stored the results which you can
        query with `ProductionFetcher.has_data()` and
        `ProductionFetcher.get_data()`.

        :param timestamp: used to get new productions after (inclusive)
        """

        parameters = {
            "created_at[after]": timestamp,
            "page": 1
        }
        productions_data = self.vnv_wrapper.GET("/productions", parameters)

        production_count = productions_data["totalItems"]

        productions_list = productions_data["member"]
        fetched_count = len(productions_list)
        self._data = productions_list

        while fetched_count < production_count:
            parameters["page"] += 1
            productions_data = self.vnv_wrapper.GET("/productions", parameters)

            productions_list = productions_data["member"]
            fetched_count += len(productions_list)
            self._data.extend(productions_list)

            new_production_count = productions_data["totalItems"]
            if new_production_count >= production_count:
                production_count = new_production_count
            else:
                # TODO:
                #   if there are less we're in trouble, will have to refetch
                #   everything?
                raise RuntimeError("totalItems decreased during pagination")

        return_val = self._data
        self._data = None
        return return_val

    def has_data(self) -> bool:
        return self._data is not None

    def get_data(self) -> list:
        return self._data
