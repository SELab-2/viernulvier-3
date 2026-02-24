# Configuration of integration tests
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from fastapi.testclient import TestClient

from src.main import app
from src.database import get_db

TEST_DATABASE_URL = "" # TBD

# Create test engine
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)


# Override dependency
async def override_get_db():
    async with TestSessionLocal() as session:
        yield session


@pytest.fixure(scope="session")
def client():
    app.dependecy_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
