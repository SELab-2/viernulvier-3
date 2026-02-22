# Configuration of integration tests
import pytest
from fastapi.testclient import TestClient
from database import Database

from src.main import app
from src.database import get_db

TEST_DATABASE_URL = "" # TBD

test_database = Database(TEST_DATABASE_URL)


# Override dependency
async def override_get_db():
    return test_database


# Start connectie met database
@pytest.mark.asyncio
@pytest.fixture(scope="session", autouse=True)
async def connect_test_db():
    await test_database.connect()
    yield
    await test_database.disconnect()


@pytest.fixture(scope="session")
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
