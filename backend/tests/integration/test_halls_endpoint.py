from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.hall import Hall
from src.models.user import User
from src.models.role import Role
from src.services.auth.password import get_password_hash
from src.services.auth.permissions import Permissions


BASE_URL = "/api/v1/archive/halls"


def create_user_and_login(
    client: TestClient, db_session: Session, username: str, permissions=None
):
    password = "test_pw"
    hashed = get_password_hash(password)

    role = Role(name=f"{username}_role")

    # Voeg Permission objecten toe
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


def test_get_all_halls(client: TestClient, db_session: Session):
    hall = Hall(name="Hall A", address="Street A")
    db_session.add(hall)
    db_session.commit()

    response = client.get(BASE_URL + "/")

    assert response.status_code == 200
    data = response.json()

    assert len(data) == 1
    assert data[0]["name"] == "Hall A"


def test_get_hall_by_id(client: TestClient, db_session: Session):
    hall = Hall(name="Hall B", address="Street B")
    db_session.add(hall)
    db_session.commit()

    response = client.get(f"{BASE_URL}/{hall.id}")

    assert response.status_code == 200
    data = response.json()

    assert data["name"] == "Hall B"


def test_get_hall_not_found(client: TestClient):
    response = client.get(f"{BASE_URL}/999")

    assert response.status_code == 404


def test_create_hall(client: TestClient, db_session: Session):
    headers = create_user_and_login(
        client, db_session, "create_hall_user", [Permissions.ARCHIVE_CREATE]
    )

    response = client.post(
        BASE_URL + "/",
        json={"name": "New Hall", "address": "New Street"},
        headers=headers,
    )

    print(response.json())
    assert response.status_code == 201
    data = response.json()

    assert data["name"] == "New Hall"


def test_update_hall(client: TestClient, db_session: Session):
    headers = create_user_and_login(
        client, db_session, "update_hall_user", [Permissions.ARCHIVE_UPDATE]
    )

    hall = Hall(name="Old Hall", address="Old Street")
    db_session.add(hall)
    db_session.commit()

    response = client.patch(
        f"{BASE_URL}/{hall.id}",
        json={"name": "Updated Hall", "address": "Updated Street"},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()

    assert data["name"] == "Updated Hall"


def test_delete_hall(client: TestClient, db_session: Session):
    headers = create_user_and_login(
        client, db_session, "delete_hall_user", [Permissions.ARCHIVE_DELETE]
    )

    hall = Hall(name="Delete Hall", address="Delete Street")
    db_session.add(hall)
    db_session.commit()

    response = client.delete(f"{BASE_URL}/{hall.id}", headers=headers)

    assert response.status_code == 204


def test_create_hall_without_permission(client: TestClient, db_session: Session):
    headers = create_user_and_login(client, db_session, "no_permission_user")

    response = client.post(
        BASE_URL + "/",
        json={"name": "Should Fail", "address": "Fail Street"},
        headers=headers,
    )

    assert response.status_code == 403
