from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.history import History
from src.models.role import Role
from src.models.user import User
from src.services.auth.password import get_password_hash
from src.services.auth.permissions import Permissions


BASE_URL = "/api/v1/archive/history"


def create_user_and_login(
    client: TestClient, db_session: Session, username: str, permissions=None
):
    password = "test_pw"
    hashed = get_password_hash(password)

    role = Role(name=f"{username}_role")

    if permissions:
        from src.models.permission import Permission

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


def test_get_all_history(client: TestClient, db_session: Session):
    db_session.add_all(
        [
            History(year=2024, language="nl", title="NL", content="Nederlandse tekst"),
            History(year=2024, language="en", title="EN", content="English text"),
        ]
    )
    db_session.commit()

    response = client.get(BASE_URL + "/")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert all("id_url" in item for item in data)


def test_get_all_history_with_language_filter(client: TestClient, db_session: Session):
    db_session.add_all(
        [
            History(year=2025, language="nl", title="Alleen NL", content="Tekst"),
            History(year=2025, language="en", title="Only EN", content="Text"),
        ]
    )
    db_session.commit()

    response = client.get(BASE_URL + "/", headers={"Accept-Language": "nl"})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["language"] == "nl"


def test_get_all_history_with_sort_order_ascending(
    client: TestClient, db_session: Session
):
    db_session.add_all(
        [
            History(year=2024, language="nl", title="Y2024", content="A"),
            History(year=2022, language="en", title="Y2022", content="B"),
            History(year=2023, language="nl", title="Y2023", content="C"),
        ]
    )
    db_session.commit()

    response = client.get(BASE_URL + "/?sort_order=Ascending")

    assert response.status_code == 200
    data = response.json()
    assert [item["year"] for item in data] == [2022, 2023, 2024]


def test_get_history_by_key(client: TestClient, db_session: Session):
    entry = History(year=2000, language="en", title="Millennium", content="History")
    db_session.add(entry)
    db_session.commit()

    response = client.get(f"{BASE_URL}/{entry.year}/{entry.language}")

    assert response.status_code == 200
    data = response.json()
    assert data["id_url"].endswith(f"{entry.year}/{entry.language}")
    assert data["year"] == 2000


def test_get_history_not_found(client: TestClient):
    response = client.get(f"{BASE_URL}/9999/nl")

    assert response.status_code == 404


def test_create_history(client: TestClient, db_session: Session):
    headers = create_user_and_login(
        client,
        db_session,
        "create_history_user",
        [Permissions.HISTORY_CREATE],
    )

    response = client.post(
        BASE_URL + "/",
        json={
            "year": 2026,
            "language": "nl",
            "title": "Nieuw jaar",
            "content": "Content",
        },
        headers=headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert data["year"] == 2026
    assert data["language"] == "nl"


def test_create_history_without_permission(client: TestClient, db_session: Session):
    headers = create_user_and_login(client, db_session, "history_no_create")

    response = client.post(
        BASE_URL + "/",
        json={"year": 2026, "language": "nl", "title": "X", "content": "Y"},
        headers=headers,
    )

    assert response.status_code == 403


def test_create_history_duplicate_returns_400(client: TestClient, db_session: Session):
    headers = create_user_and_login(
        client,
        db_session,
        "history_duplicate_create",
        [Permissions.HISTORY_CREATE],
    )

    db_session.add(History(year=2030, language="en", title="A", content="A"))
    db_session.commit()

    response = client.post(
        BASE_URL + "/",
        json={"year": 2030, "language": "en", "title": "B", "content": "B"},
        headers=headers,
    )

    assert response.status_code == 400


def test_update_history(client: TestClient, db_session: Session):
    headers = create_user_and_login(
        client,
        db_session,
        "update_history_user",
        [Permissions.HISTORY_UPDATE],
    )

    entry = History(year=2011, language="nl", title="Oud", content="Oud")
    db_session.add(entry)
    db_session.commit()

    response = client.patch(
        f"{BASE_URL}/{entry.year}/{entry.language}",
        json={"title": "Nieuw", "content": "Nieuw"},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Nieuw"
    assert data["content"] == "Nieuw"


def test_update_history_without_permission(client: TestClient, db_session: Session):
    headers = create_user_and_login(client, db_session, "history_no_update")

    entry = History(year=2012, language="en", title="Old", content="Old")
    db_session.add(entry)
    db_session.commit()

    response = client.patch(
        f"{BASE_URL}/{entry.year}/{entry.language}",
        json={"title": "New"},
        headers=headers,
    )

    assert response.status_code == 403


def test_update_history_not_found(client: TestClient, db_session: Session):
    headers = create_user_and_login(
        client,
        db_session,
        "history_update_not_found",
        [Permissions.HISTORY_UPDATE],
    )

    response = client.patch(
        f"{BASE_URL}/9999/nl",
        json={"title": "New"},
        headers=headers,
    )

    assert response.status_code == 404


def test_delete_history(client: TestClient, db_session: Session):
    headers = create_user_and_login(
        client,
        db_session,
        "delete_history_user",
        [Permissions.HISTORY_DELETE],
    )

    entry = History(year=2013, language="nl", title="Delete", content="Delete")
    db_session.add(entry)
    db_session.commit()

    response = client.delete(
        f"{BASE_URL}/{entry.year}/{entry.language}", headers=headers
    )

    assert response.status_code == 204


def test_delete_history_without_permission(client: TestClient, db_session: Session):
    headers = create_user_and_login(client, db_session, "history_no_delete")

    entry = History(year=2014, language="en", title="Delete", content="Delete")
    db_session.add(entry)
    db_session.commit()

    response = client.delete(
        f"{BASE_URL}/{entry.year}/{entry.language}", headers=headers
    )

    assert response.status_code == 403


def test_delete_history_not_found(client: TestClient, db_session: Session):
    headers = create_user_and_login(
        client,
        db_session,
        "history_delete_not_found",
        [Permissions.HISTORY_DELETE],
    )

    response = client.delete(f"{BASE_URL}/9999/nl", headers=headers)

    assert response.status_code == 404
