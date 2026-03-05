import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from src.models.role import Role
from src.models.permission import Permission
from src.models.user import User
from src.services.auth.password import get_password_hash
from src.services.auth.permissions import Permissions


def create_user_with_permissions(
    db: Session, username: str, permissions: list[str]
) -> User:
    perms = []
    for p in permissions:
        perm = db.query(Permission).filter(Permission.name == p).first()
        if not perm:
            perm = Permission(name=p)
            db.add(perm)
        perms.append(perm)
    db.commit()
    role = Role(name=f"role_{username}", permissions=perms)
    db.add(role)
    db.commit()
    user = User(
        username=username, hashed_password=get_password_hash("pw"), roles=[role]
    )
    db.add(user)
    db.commit()
    return user


def get_token(client: TestClient, username: str) -> str:
    response = client.post(
        "/api/v1/auth/login/", json={"username": username, "password": "pw"}
    )
    return response.json()["access_token"]


def test_permissions_endpoint_requires_users_read(
    client: TestClient, db_session: Session
):
    user = create_user_with_permissions(
        db_session, "perm_user", [Permissions.USERS_READ]
    )
    token = get_token(client, "perm_user")
    response = client.get(
        "/api/v1/auth/permissions/", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    perms = response.json()
    assert any(p["name"] == Permissions.USERS_READ for p in perms)


def test_permissions_endpoint_forbidden(client: TestClient, db_session: Session):
    user = create_user_with_permissions(db_session, "noperm_user", [])
    token = get_token(client, "noperm_user")
    response = client.get(
        "/api/v1/auth/permissions/", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403


def test_roles_crud(client: TestClient, db_session: Session):
    user = create_user_with_permissions(
        db_session,
        "admin",
        [
            Permissions.USERS_READ,
            Permissions.USERS_CREATE,
            Permissions.USERS_UPDATE,
            Permissions.USERS_DELETE,
        ],
    )
    token = get_token(client, "admin")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/auth/roles/",
        json={"name": "testrole", "permissions": [Permissions.USERS_READ]},
        headers=headers,
    )
    assert response.status_code == 201
    role_id = response.json()["id"]

    response = client.get(f"/api/v1/auth/roles/{role_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "testrole"

    response = client.put(
        f"/api/v1/auth/roles/{role_id}",
        json={"name": "updatedrole", "permissions": [Permissions.USERS_READ]},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "updatedrole"

    response = client.get("/api/v1/auth/roles/", headers=headers)
    assert response.status_code == 200
    assert any(r["name"] == "updatedrole" for r in response.json())

    response = client.delete(f"/api/v1/auth/roles/{role_id}", headers=headers)
    assert response.status_code == 204


def test_roles_permission_enforcement(client: TestClient, db_session: Session):
    user = create_user_with_permissions(
        db_session, "readonly", [Permissions.USERS_READ]
    )
    token = get_token(client, "readonly")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/auth/roles/",
        json={"name": "failrole", "permissions": []},
        headers=headers,
    )
    assert response.status_code == 403

    role = Role(name="failrole", permissions=[])
    db_session.add(role)
    db_session.commit()
    response = client.put(
        f"/api/v1/auth/roles/{role.id}",
        json={"name": "failrole2", "permissions": []},
        headers=headers,
    )
    assert response.status_code == 403

    response = client.delete(f"/api/v1/auth/roles/{role.id}", headers=headers)
    assert response.status_code == 403
