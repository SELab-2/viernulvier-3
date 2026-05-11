import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from src.services.auth.password import get_password_hash
from src.services.auth.permissions import Permissions
from src.models.user import User
from src.models.role import Role
from src.models.permission import Permission
from src.models.print import Print
from datetime import datetime, timezone

BASE_URL = "/api/v1/archive/prints"


def create_user_and_login(
    client: TestClient,
    db_session: Session,
    username: str,
    permissions=None,
):
    password = "test_pw"
    hashed = get_password_hash(password)

    role = Role(name=f"{username}_role")
    if permissions:
        perm_objs = []
        for p in permissions:
            perm = db_session.query(Permission).filter_by(name=p).first()
            if not perm:
                perm = Permission(name=p)
                db_session.add(perm)
            perm_objs.append(perm)
        role.permissions = perm_objs

    user = User(username=username, hashed_password=hashed, roles=[role])
    db_session.add(role)
    db_session.add(user)
    db_session.commit()

    login_response = client.post(
        "/api/v1/auth/login/", json={"username": username, "password": password}
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def print_item(db_session: Session) -> Print:
    p = Print(
        object_key="prints/fixture.pdf",
        content_type="application/pdf",
        title="Fixture poster",
        description="A fixture poster for testing",
        print_type="poster",
        uploaded_at=datetime.now(timezone.utc),
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


@pytest.fixture
def print_items(db_session: Session) -> list[Print]:
    items = []
    for i in range(3):
        p = Print(
            object_key=f"prints/fixture-{i}.pdf",
            content_type="application/pdf",
            title=f"Poster {i}",
            description=f"Description for poster {i}",
            print_type="poster" if i % 2 == 0 else "timetable",
            uploaded_at=datetime.now(timezone.utc),
        )
        db_session.add(p)
        items.append(p)
    db_session.commit()
    for p in items:
        db_session.refresh(p)
    return items


# ---------------------------------------------------------------------------
# POST /prints/
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "content_type", ["image/jpeg", "image/png", "image/webp", "application/pdf"]
)
def test_upload_print_success(
    client: TestClient, db_session: Session, content_type: str
):
    headers = create_user_and_login(
        client, db_session, "upload_user", [Permissions.ARCHIVE_CREATE]
    )
    response = client.post(
        f"{BASE_URL}/?title=Affiche&description=Seizoen+2024&print_type=poster",
        files={"file": ("test.pdf", io.BytesIO(b"fake data"), content_type)},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["content_type"] == content_type
    assert data["title"] == "Affiche"
    assert data["description"] == "Seizoen 2024"
    assert data["print_type"] == "poster"
    assert "url" in data
    assert "id_url" in data
    assert "uploaded_at" in data


def test_upload_print_optional_fields_absent(client: TestClient, db_session: Session):
    headers = create_user_and_login(
        client, db_session, "upload_user2", [Permissions.ARCHIVE_CREATE]
    )
    response = client.post(
        f"{BASE_URL}/",
        files={"file": ("test.pdf", io.BytesIO(b"fake data"), "application/pdf")},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] is None
    assert data["description"] is None
    assert data["print_type"] is None


def test_upload_print_unsupported_type(client: TestClient, db_session: Session):
    headers = create_user_and_login(
        client, db_session, "upload_user3", [Permissions.ARCHIVE_CREATE]
    )
    response = client.post(
        f"{BASE_URL}/",
        files={"file": ("bad.mp4", io.BytesIO(b"fake data"), "video/mp4")},
        headers=headers,
    )
    assert response.status_code == 415
    assert "not accepted" in response.json()["detail"]


def test_upload_print_no_permission(client: TestClient, db_session: Session):
    headers = create_user_and_login(client, db_session, "no_perm_user")
    response = client.post(
        f"{BASE_URL}/",
        files={"file": ("test.pdf", io.BytesIO(b"fake"), "application/pdf")},
        headers=headers,
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# GET /prints/
# ---------------------------------------------------------------------------


def test_list_prints_empty(client: TestClient):
    response = client.get(f"{BASE_URL}/")
    assert response.status_code == 200
    data = response.json()
    assert data["prints"] == []
    assert data["pagination"]["total_count"] == 0
    assert data["pagination"]["has_more"] is False


def test_list_prints(client: TestClient, print_items):
    response = client.get(f"{BASE_URL}/")
    assert response.status_code == 200
    data = response.json()
    assert len(data["prints"]) == 3
    assert data["pagination"]["total_count"] == 3
    assert data["pagination"]["has_more"] is False
    for item in data["prints"]:
        assert "url" in item
        assert "id_url" in item
        assert "content_type" in item
        assert "uploaded_at" in item


def test_list_prints_filter_by_type(client: TestClient, print_items):
    response = client.get(f"{BASE_URL}/?print_type=timetable")
    assert response.status_code == 200
    assert all(p["print_type"] == "timetable" for p in response.json()["prints"])


def test_list_prints_pagination(client: TestClient, print_items):
    page1 = client.get(f"{BASE_URL}/?limit=2").json()
    assert len(page1["prints"]) == 2
    assert page1["pagination"]["total_count"] == 3
    assert page1["pagination"]["has_more"] is True
    next_cursor = page1["pagination"]["next_cursor"]
    assert next_cursor is not None

    page2 = client.get(f"{BASE_URL}/?cursor={next_cursor}&limit=2").json()
    assert len(page2["prints"]) == 1
    assert page2["pagination"]["total_count"] == 3
    assert page2["pagination"]["has_more"] is False


def test_list_prints_invalid_cursor(client: TestClient):
    response = client.get(f"{BASE_URL}/?cursor=notanumber")
    assert response.status_code == 422


def test_list_prints_invalid_limit(client: TestClient):
    response = client.get(f"{BASE_URL}/?limit=0")
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# GET /prints/{id}
# ---------------------------------------------------------------------------


def test_get_print(client: TestClient, print_item):
    response = client.get(f"{BASE_URL}/{print_item.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Fixture poster"
    assert data["description"] == "A fixture poster for testing"
    assert data["print_type"] == "poster"
    assert data["content_type"] == "application/pdf"
    assert "url" in data
    assert "id_url" in data
    assert "uploaded_at" in data
    assert f"prints/{print_item.id}" in data["id_url"]


def test_get_print_not_found(client: TestClient):
    response = client.get(f"{BASE_URL}/999999")
    assert response.status_code == 404
    assert "Print" in response.json()["detail"]


# ---------------------------------------------------------------------------
# DELETE /prints/{id}
# ---------------------------------------------------------------------------


def test_delete_print_success(client: TestClient, db_session: Session, print_item):
    headers = create_user_and_login(
        client, db_session, "delete_user", [Permissions.ARCHIVE_DELETE]
    )
    response = client.delete(f"{BASE_URL}/{print_item.id}", headers=headers)
    assert response.status_code == 204
    assert client.get(f"{BASE_URL}/{print_item.id}").status_code == 404


def test_delete_print_no_permission(
    client: TestClient, db_session: Session, print_item
):
    headers = create_user_and_login(client, db_session, "no_perm_user")
    response = client.delete(f"{BASE_URL}/{print_item.id}", headers=headers)
    assert response.status_code == 403


def test_delete_print_not_found(client: TestClient, db_session: Session):
    headers = create_user_and_login(
        client, db_session, "delete_user2", [Permissions.ARCHIVE_DELETE]
    )
    response = client.delete(f"{BASE_URL}/999999", headers=headers)
    assert response.status_code == 404
    assert "Print" in response.json()["detail"]
