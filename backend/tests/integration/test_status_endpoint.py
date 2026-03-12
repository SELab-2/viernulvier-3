from src.schemas.status import ComponentStatus


class TestHealthEndpoint:
    """Integration tests for GET /v1/health.

    These tests hit the actual HTTP layer via TestClient with a real SQLite
    database, wired up by the fixtures in conftest.py.
    """

    def test_returns_200(self, client):
        response = client.get("/v1/health")
        assert response.status_code == 200

    def test_response_schema(self, client):
        response = client.get("/v1/health")
        body = response.json()

        assert "status" in body
        assert "database" in body
        assert "detail" in body

    def test_healthy_when_db_available(self, client):
        response = client.get("/v1/health")
        body = response.json()

        assert body["status"] == ComponentStatus.OK
        assert body["database"] == ComponentStatus.OK
        assert body["detail"] is None
