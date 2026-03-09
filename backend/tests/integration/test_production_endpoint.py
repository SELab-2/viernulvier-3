from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timezone

import pytest
from src.models.event import Event
from src.models.hall import Hall
from src.models.production import Production
from src.models.user import User
from src.models.role import Role
from src.services.auth.password import get_password_hash
from src.services.auth.permissions import Permissions


BASE_URL = "/api/v1/archive/productions"

# Test getting productions with pagination.
def test_get_productions_paginated(client: TestClient, db_session: Session):
    productions = []
    for i in range(10):
        productions.append(Production(
            performer_type="theater", attendance_mode="offline", media_gallery_id=i+1, 
            created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc)))
    
    db_session.add_all(productions)
    db_session.commit()
    
    # Get first page.
    response = client.get(f"{BASE_URL}?limit=5")
    print(response.json())
    assert response.status_code == 200
    data = response.json()
    assert len(data["productions"]) == 5
    assert data["pagination"]["has_more"]

    # Get second page using next_cursor.
    next_cursor = data["pagination"]["next_cursor"]
    response = client.get(f"{BASE_URL}?cursor={next_cursor}&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data["productions"]) == 5
    assert not data["pagination"]["has_more"]

    next_cursor = data["pagination"]["next_cursor"]
    assert next_cursor is None