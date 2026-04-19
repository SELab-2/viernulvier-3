from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.permission import Permission
from src.models.role import Role
from src.models.user import User
from src.services.auth.password import get_password_hash
from src.services.auth.permissions import Permissions


def create_role_with_permissions(
    db: Session, role_name: str, permissions: list[str]
) -> Role:
    perms = []
    for permission_name in permissions:
        permission = (
            db.query(Permission).filter(Permission.name == permission_name).first()
        )
        if not permission:
            permission = Permission(name=permission_name)
            db.add(permission)
            db.flush()
        perms.append(permission)

    role = Role(name=role_name, permissions=perms)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def create_user_with_permissions(
    db: Session, username: str, permissions: list[str], super_user: bool = False
) -> User:
    role = create_role_with_permissions(db, f"role_{username}", permissions)
    user = User(
        username=username,
        hashed_password=get_password_hash("pw"),
        roles=[role],
        super_user=super_user,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_token(client: TestClient, username: str) -> str:
    response = client.post(
        "/api/v1/auth/login/", json={"username": username, "password": "pw"}
    )
    return response.json()["access_token"]


def test_users_crud_endpoints(client: TestClient, db_session: Session):
    create_user_with_permissions(
        db_session,
        "admin",
        [
            Permissions.USERS_READ,
            Permissions.USERS_CREATE,
            Permissions.USERS_UPDATE,
            Permissions.USERS_DELETE,
        ],
    )
    create_role_with_permissions(db_session, "viewer", [Permissions.USERS_READ])
    headers = {"Authorization": f"Bearer {get_token(client, 'admin')}"}

    response = client.post(
        "/api/v1/auth/users/",
        json={"username": "bob", "password": "secret", "roles": ["viewer"]},
        headers=headers,
    )
    assert response.status_code == 201
    created = response.json()
    assert created["username"] == "bob"
    assert created["super_user"] is False
    assert created["roles"] == ["viewer"]
    assert created["permissions"] == [Permissions.USERS_READ]
    assert isinstance(created["id"], int)
    user_id = created["id"]

    response = client.get(f"/api/v1/auth/users/{user_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["username"] == "bob"

    response = client.patch(
        f"/api/v1/auth/users/{user_id}",
        json={"username": "bobby"},
        headers=headers,
    )
    assert response.status_code == 200
    patched = response.json()
    assert patched["username"] == "bobby"
    assert patched["roles"] == ["viewer"]
    assert patched["permissions"] == [Permissions.USERS_READ]

    response = client.post(
        "/api/v1/auth/login/",
        json={"username": "bobby", "password": "secret"},
    )
    assert response.status_code == 200

    response = client.put(
        f"/api/v1/auth/users/{user_id}",
        json={"username": "robert", "password": "new-secret", "roles": []},
        headers=headers,
    )
    assert response.status_code == 200
    updated = response.json()
    assert updated["username"] == "robert"
    assert updated["roles"] == []
    assert updated["permissions"] == []

    response = client.post(
        "/api/v1/auth/login/",
        json={"username": "robert", "password": "new-secret"},
    )
    assert response.status_code == 200

    response = client.get("/api/v1/auth/users/", headers=headers)
    assert response.status_code == 200
    assert any(user["username"] == "robert" for user in response.json())

    response = client.delete(f"/api/v1/auth/users/{user_id}", headers=headers)
    assert response.status_code == 204

    response = client.get(f"/api/v1/auth/users/{user_id}", headers=headers)
    assert response.status_code == 404


def test_users_permissions_are_enforced(client: TestClient, db_session: Session):
    readonly = create_user_with_permissions(
        db_session,
        "readonly",
        [Permissions.USERS_READ],
    )
    create_role_with_permissions(db_session, "viewer", [Permissions.USERS_READ])
    target = User(username="target", hashed_password=get_password_hash("pw"))
    db_session.add(target)
    db_session.commit()
    db_session.refresh(target)

    headers = {"Authorization": f"Bearer {get_token(client, readonly.username)}"}

    response = client.get("/api/v1/auth/users/", headers=headers)
    assert response.status_code == 200

    response = client.get(f"/api/v1/auth/users/{target.id}", headers=headers)
    assert response.status_code == 200

    response = client.post(
        "/api/v1/auth/users/",
        json={"username": "new-user", "password": "secret", "roles": ["viewer"]},
        headers=headers,
    )
    assert response.status_code == 403

    response = client.put(
        f"/api/v1/auth/users/{target.id}",
        json={"username": "updated-target", "password": None, "roles": []},
        headers=headers,
    )
    assert response.status_code == 403

    response = client.patch(
        f"/api/v1/auth/users/{target.id}",
        json={"username": "patched-target"},
        headers=headers,
    )
    assert response.status_code == 403

    response = client.delete(f"/api/v1/auth/users/{target.id}", headers=headers)
    assert response.status_code == 403


def test_create_user_rejects_unknown_role(client: TestClient, db_session: Session):
    create_user_with_permissions(
        db_session,
        "admin",
        [Permissions.USERS_READ, Permissions.USERS_CREATE],
    )
    headers = {"Authorization": f"Bearer {get_token(client, 'admin')}"}

    response = client.post(
        "/api/v1/auth/users/",
        json={"username": "bob", "password": "secret", "roles": ["missing"]},
        headers=headers,
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid roles: missing"


def test_put_requires_complete_payload_but_patch_allows_partial_updates(
    client: TestClient, db_session: Session
):
    create_user_with_permissions(
        db_session,
        "admin",
        [Permissions.USERS_UPDATE],
    )
    target = User(username="target", hashed_password=get_password_hash("pw"))
    db_session.add(target)
    db_session.commit()
    db_session.refresh(target)

    headers = {"Authorization": f"Bearer {get_token(client, 'admin')}"}

    response = client.put(
        f"/api/v1/auth/users/{target.id}",
        json={"username": "updated-target"},
        headers=headers,
    )
    assert response.status_code == 422

    response = client.patch(
        f"/api/v1/auth/users/{target.id}",
        json={"username": "updated-target"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["username"] == "updated-target"


def test_delete_super_user_is_forbidden(client: TestClient, db_session: Session):
    actor = create_user_with_permissions(
        db_session,
        "admin",
        [Permissions.USERS_DELETE],
    )
    target = create_user_with_permissions(
        db_session,
        "root",
        [],
        super_user=True,
    )

    headers = {"Authorization": f"Bearer {get_token(client, actor.username)}"}

    response = client.delete(f"/api/v1/auth/users/{target.id}", headers=headers)

    assert response.status_code == 403
    assert response.json()["detail"] == "Super users cannot be deleted"


def test_user_cannot_delete_self(client: TestClient, db_session: Session):
    actor = create_user_with_permissions(
        db_session,
        "admin",
        [Permissions.USERS_DELETE],
    )
    headers = {"Authorization": f"Bearer {get_token(client, actor.username)}"}

    response = client.delete(f"/api/v1/auth/users/{actor.id}", headers=headers)

    assert response.status_code == 403
    assert response.json()["detail"] == "You cannot delete your own account"
