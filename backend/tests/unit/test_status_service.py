from unittest.mock import MagicMock

import pytest
from src.schemas.status import ComponentStatus
from src.services.status import get_health


class TestGetHealth:
    """Unit tests for the get_health service function.

    The database session is mocked so these tests never touch a real database.
    """

    def test_returns_ok_when_db_reachable(self):
        mock_db = MagicMock()
        result = get_health(mock_db)

        assert result.status == ComponentStatus.OK
        assert result.database == ComponentStatus.OK
        assert result.detail is None

    def test_returns_error_when_db_unreachable(self):
        mock_db = MagicMock()
        mock_db.execute.side_effect = Exception("connection refused")

        result = get_health(mock_db)

        assert result.status == ComponentStatus.ERROR
        assert result.database == ComponentStatus.ERROR
        assert result.detail == "connection refused"

    def test_overall_status_reflects_db_status(self):
        """overall status must degrade when any component is unhealthy."""
        mock_db = MagicMock()
        mock_db.execute.side_effect = Exception("timeout")

        result = get_health(mock_db)

        assert result.status == result.database
