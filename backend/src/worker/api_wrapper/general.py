import http.client
import json
from urllib.parse import urlencode

from src.config import settings


class VNV_Wrapper:
    def __init__(self):
        self.connection = http.client.HTTPSConnection("www.viernulvier.gent")
        self.headers = {
            "accept": "application/json",
            "X-AUTH-TOKEN": settings.VIERNULVIER_KEY,
            "User-Agent": "curl"  # wtf, why do they check this
        }

    def close(self):
        self.connection.close()
        print("[DEBUG] closed connection")

    # Support use of 'with()' with the __enter__() and __exit__() magic methods
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.close()

    def GET(self, path, params: dict | None = None):
        parsed_params = ""
        if params is not None:
            parsed_params = "?" + urlencode(params)

        if path[0] == '/':
            link = f"/api/v1{path}{parsed_params}"
        else:
            link = f"/api/v1/{path}{parsed_params}"

        print(f"[DEBUG] {link=}")
        self.connection.request("GET", link, headers=self.headers)

        result = self.connection.getresponse()
        status = result.status

        if not (200 <= status < 300):
            raise ConnectionError(
                '{' + f'"status": {status}, "reason": "{result.reason}"' + '}'
            )

        data = result.read()
        return json.loads(data)
