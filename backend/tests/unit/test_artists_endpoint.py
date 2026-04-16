import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from src.main import app
from src.database import get_db

MOCK_ROWS = [
    (1, "en", "Artist A"),
    (1, "nl", "Artiest A"),
    (2, "en", "Artist B"),
    (3, "nl", "Artiest C"),
]


@pytest.fixture
def client():
    db = MagicMock()
    db.query().with_entities().all.return_value = MOCK_ROWS

    app.dependency_overrides[get_db] = lambda: db
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_get_all_artists(client):
    response = client.get("/api/v1/archive/artists/")

    assert response.status_code == 200

    data = response.json()

    assert "en" in data
    assert "nl" in data

    assert "Artist A" in data["en"]
    assert "Artist B" in data["en"]
    assert "Artiest C" in data["en"]
    assert "Artiest A" in data["nl"]
    assert "Artist B" in data["nl"]
    assert "Artiest C" in data["nl"]


def test_get_all_artists_response_structure(client):
    response = client.get("/api/v1/archive/artists/")
    data = response.json()

    assert isinstance(data["en"], list)
    assert isinstance(data["nl"], list)
    assert all(isinstance(a, str) for a in data["en"])
    assert all(isinstance(a, str) for a in data["nl"])
