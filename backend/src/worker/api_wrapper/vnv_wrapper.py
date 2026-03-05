import http.client
import json
import logging
import time
from urllib.parse import urlencode

from src.config import settings


logging.basicConfig(
    # filename="sync_job.log",
    # filemode="w",
    format='[%(levelname)s %(asctime)s] %(message)s'
)


class VNV_Wrapper:
    def __init__(self, connection=None, sleep=time.sleep):
        """
        ---

        :param connection: injectable connection, should only be used for tests
        :param sleep: injectable sleep function, should only be used for tests
        """
        if connection is None:
            self.connection = http.client.HTTPSConnection(
                "www.viernulvier.gent"
            )
        else:
            self.connection = connection
        self.sleep = sleep

        self.headers = {
            "accept": "application/ld+json",
            "X-AUTH-TOKEN": settings.VIERNULVIER_KEY,
            "User-Agent": "curl"  # wtf, why do they check this
        }

        # Initialize logger
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.DEBUG)
        self.logger.info("connection with viernulvier.gent created")

    def close(self):
        self.connection.close()
        self.logger.info("connection closed")

    # Support use of 'with()' with the __enter__() and __exit__() magic methods
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.close()

    def GET(self, path, params: dict | None = None):
        """
        Send a GET request to viernulvier.gent.

        The optional params will be encoded inside this GET method using
        `urllib.urlencode(params)`.

        :param path: path to the resources, pasted behind `viernulvier.gent`
        :param params: optional dictionary with params
        :returns: the json-parsed response dict
        :raises RateLimitError: on 429 response status
        :raises ConnectionError: on other non-ok response status
        """
        parsed_params = ""
        if params is not None:
            parsed_params = "?" + urlencode(params)

        if path[0] == '/':
            link = f"/api/v1{path}{parsed_params}"
        else:
            link = f"/api/v1/{path}{parsed_params}"

        self.logger.debug(f"VNV_Wrapper.GET, created_link = {link}")

        tries = 0
        MAX_TRIES = 5

        while True:
            self.connection.request("GET", link, headers=self.headers)

            result = self.connection.getresponse()
            status = result.status

            if status == 429 and tries < MAX_TRIES:
                tries += 1
                self.logger.warning(
                    "Response status 429, retrying after 5s "
                    f"({tries}/{MAX_TRIES})"
                )
                # From other group, 5s delay seems fine
                self.sleep(5)

            elif not (200 <= status < 300):
                self.logger.error(
                    f"Request failed ({status}), reason: {result.reason}"
                )
                raise ConnectionError(
                    '{'
                    + f'"status": {status}, "reason": "{result.reason}"'
                    + '}'
                )

            else:
                # Success path
                data = result.read()
                self.logger.debug("Request succesful, returning data")
                return json.loads(data)
