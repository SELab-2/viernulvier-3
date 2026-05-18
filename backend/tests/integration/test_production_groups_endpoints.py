import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from src.models.production_group import ProductionGroup
from src.models.role import Role
from src.models.user import User
from src.services.auth.password import get_password_hash
from src.services.auth.permissions import Permissions

PRODUCTION_GROUPS_URL = "/api/v1/archive/series"


def create_user_and_login(
    client: TestClient, db_session: Session, username: str, permissions=None
):
    password = "test_pw"
    hashed = get_password_hash(password)

    role = Role(name=f"{username}_role")
    if permissions:
        from src.models.permission import Permission

        perm_objs = []
        for permission_name in permissions:
            permission = (
                db_session.query(Permission).filter_by(name=permission_name).first()
            )
            if not permission:
                permission = Permission(name=permission_name)
                db_session.add(permission)
            perm_objs.append(permission)
        role.permissions = perm_objs

    user = User(username=username, hashed_password=hashed, roles=[role])
    db_session.add(role)
    db_session.add(user)
    db_session.commit()

    login_response = client.post(
        "/api/v1/auth/login", json={"username": username, "password": password}
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def create_headers(client: TestClient, db_session: Session):
    return create_user_and_login(
        client,
        db_session,
        "create_production_group_user",
        permissions=[Permissions.ARCHIVE_CREATE],
    )


def test_create_production_group(
    client: TestClient, create_headers, productions_limited
):
    response = client.post(
        PRODUCTION_GROUPS_URL,
        json={
            "title": "  Weekend picks  ",
            "is_public_filter": False,
            "production_id_urls": [
                f"/productions/{productions_limited[0].id}",
                f"/productions/{productions_limited[0].id}",
            ],
        },
        headers=create_headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Weekend picks"
    assert data["is_public_filter"] is False
    assert data["production_id_urls"] == [
        f"http://testserver/api/v1/archive/productions/{productions_limited[0].id}"
    ]


def test_create_production_group_unauthorized(client: TestClient, productions_limited):
    response = client.post(
        PRODUCTION_GROUPS_URL,
        json={
            "title": "Weekend picks",
            "production_id_urls": [f"/productions/{productions_limited[0].id}"],
        },
    )

    assert response.status_code == 401


def test_create_production_group_duplicate_title(
    client: TestClient, db_session: Session, create_headers, productions_limited
):
    db_session.add(ProductionGroup(title="Autumn series"))
    db_session.commit()

    response = client.post(
        PRODUCTION_GROUPS_URL,
        json={
            "title": "  autumn SERIES  ",
            "production_id_urls": [f"/productions/{productions_limited[0].id}"],
        },
        headers=create_headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "A series with this title already exists."


def test_get_production_groups_public_only_by_default(
    client: TestClient, db_session: Session, productions_limited
):
    db_session.add_all(
        [
            ProductionGroup(
                title="Public group",
                productions=[productions_limited[0]],
            ),
            ProductionGroup(
                title="Hidden group",
                productions=[productions_limited[1]],
                is_public_filter=False,
            ),
        ]
    )
    db_session.commit()

    response = client.get(PRODUCTION_GROUPS_URL)
    assert response.status_code == 200
    assert [group["title"] for group in response.json()] == ["Public group"]

    response = client.get(PRODUCTION_GROUPS_URL, params={"public_only": "false"})
    assert response.status_code == 200
    assert {group["title"] for group in response.json()} == {
        "Public group",
        "Hidden group",
    }


def test_patch_production_group(
    client: TestClient, db_session: Session, productions_limited
):
    production_group = ProductionGroup(
        title="Old title",
        productions=[productions_limited[0]],
    )
    db_session.add(production_group)
    db_session.commit()

    patch_headers = create_user_and_login(
        client,
        db_session,
        "patch_production_group_user",
        permissions=[Permissions.ARCHIVE_UPDATE],
    )
    response = client.patch(
        f"{PRODUCTION_GROUPS_URL}/{production_group.id}",
        json={
            "title": "  New title  ",
            "is_public_filter": False,
            "production_id_urls": [f"/productions/{productions_limited[1].id}"],
        },
        headers=patch_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "New title"
    assert data["is_public_filter"] is False
    assert data["production_id_urls"] == [
        f"http://testserver/api/v1/archive/productions/{productions_limited[1].id}"
    ]


def test_patch_production_group_duplicate_title(
    client: TestClient, db_session: Session
):
    db_session.add_all(
        [
            ProductionGroup(title="Spring series"),
            ProductionGroup(title="Summer series"),
        ]
    )
    db_session.commit()

    duplicate_group = (
        db_session.query(ProductionGroup)
        .filter(ProductionGroup.title == "Summer series")
        .first()
    )
    patch_headers = create_user_and_login(
        client,
        db_session,
        "patch_production_group_duplicate_title_user",
        permissions=[Permissions.ARCHIVE_UPDATE],
    )

    response = client.patch(
        f"{PRODUCTION_GROUPS_URL}/{duplicate_group.id}",
        json={"title": " spring SERIES "},
        headers=patch_headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "A series with this title already exists."


def test_delete_production_group(
    client: TestClient, db_session: Session, productions_limited
):
    production_group = ProductionGroup(
        title="Disposable group",
        productions=[productions_limited[0]],
    )
    db_session.add(production_group)
    db_session.commit()

    delete_headers = create_user_and_login(
        client,
        db_session,
        "delete_production_group_user",
        permissions=[Permissions.ARCHIVE_DELETE],
    )
    response = client.delete(
        f"{PRODUCTION_GROUPS_URL}/{production_group.id}",
        headers=delete_headers,
    )
    assert response.status_code == 204

    get_response = client.get(f"{PRODUCTION_GROUPS_URL}/{production_group.id}")
    assert get_response.status_code == 404
