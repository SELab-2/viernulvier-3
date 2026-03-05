"""
This file includes tests for the VNV_Wrapper class.
This class is the one that actually makes the HTTPS calls, so we need
to mock them. The VNV_Wrapper class is set up to take in a connection, which
gets used here to make the behaviour predictable and testable.
The VNV_Wrapper also takes in a sleep function so that it can be overriden
for the tests, that saves multiple seconds of sleep.
"""

import json
import pytest
from unittest.mock import Mock

from src.worker.api_wrapper.vnv_wrapper import VNV_Wrapper


class FakeResponse:
    """
    Mock class passed to FakeConnection that can be used as the result of a
    FakeConnection.
    """

    def __init__(self, status: int, reason: str, data: str):
        """
        :param status: status to report
        :param reason: reason to report when status is not ok
        :param data: json-string that has the actual data
        """
        self.status = status
        self.reason = reason
        self.data = data

    def read(self):
        return self.data


class FakeConnection:
    """
    Class to pass to VNV_Wrapper to mock the connection.
    """

    def __init__(self, response: FakeResponse):
        """
        :param response: response to return on `.getresponse()`
        """
        self.response = response
        self.has_been_closed = False
        self.last_request = None

    def close(self):
        self.has_been_closed = True

    def request(self, method: str, link: str, headers: dict = None):
        """
        The actual HTTPSConnection also does not return anything, so just store
        the parameters to later check if they were correct.
        """
        if headers is None:
            headers = {}
        self.last_request = (method, link, headers)

    def getresponse(self):
        return self.response


class FakeConnectionMultipleResponses(FakeConnection):
    def __init__(self, responses: list[FakeResponse]):
        self.responses = responses
        self.index = 0
        self.has_been_closed = False
        self.last_request = None

    def getresponse(self):
        response = self.responses[self.index]
        self.index += 1
        return response


def test_get_succes():
    response_data = {"totalItems": 1, "member": []}
    response_encoded = json.dumps(response_data)

    fake_connection = FakeConnection(FakeResponse(200, "OK", response_encoded))

    wrapper = VNV_Wrapper(connection=fake_connection)

    data = wrapper.GET("/productions")

    assert not fake_connection.has_been_closed

    wrapper.close()

    assert data == response_data
    assert fake_connection.has_been_closed


def test_get_succes_context_manager():
    response_data = {"totalItems": 1, "member": []}
    response_encoded = json.dumps(response_data)

    fake_connection = FakeConnection(FakeResponse(200, "OK", response_encoded))

    with VNV_Wrapper(connection=fake_connection) as wrapper:
        data = wrapper.GET("/productions")
        assert not fake_connection.has_been_closed
        assert data == response_data

    assert fake_connection.has_been_closed


def test_non_200_raises():
    fake_connection = FakeConnection(
        FakeResponse(500, "Internal Server Error", "")
    )

    wrapper = VNV_Wrapper(connection=fake_connection)
    with pytest.raises(ConnectionError):
        wrapper.GET("/test")


def test_params_encoded():
    response_data = {"ok": True}
    response_encoded = json.dumps(response_data)

    fake_connection = FakeConnection(FakeResponse(200, "", response_encoded))

    wrapper = VNV_Wrapper(connection=fake_connection)

    wrapper.GET("/productions", {"page": 2})

    method, link, _ = fake_connection.last_request

    assert method == "GET"
    assert link == "/api/v1/productions?page=2"


def test_rate_limit():
    response_data = {"ok": True}
    response_encoded = json.dumps(response_data)

    responses = [
        FakeResponse(429, "Too many requests", "{}"),
        FakeResponse(429, "Too many requests", "{}"),
        FakeResponse(429, "Too many requests", "{}"),
        FakeResponse(200, "OK", response_encoded)
    ]

    fake_connection = FakeConnectionMultipleResponses(responses)

    fake_sleep = Mock()

    wrapper = VNV_Wrapper(connection=fake_connection, sleep=fake_sleep)

    data = wrapper.GET("/test")

    assert fake_sleep.call_count == 3
    assert data == response_data
