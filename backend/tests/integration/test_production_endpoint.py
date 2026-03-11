from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from src.models.user import User
from src.models.role import Role
from src.services.auth.password import get_password_hash
from src.services.auth.permissions import Permissions

BASE_URL = "/api/v1/archive/productions"


def create_user_and_login(
    client: TestClient,
    db_session: Session,
    username: str,
    permissions=None,
    language: str | None = None,
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
    if language is not None:
        return {"Authorization": f"Bearer {token}", "Accept-Language": language}
    return {"Authorization": f"Bearer {token}"}


# Any user should be able to get all existing productions (with pagination).
def test_get_productions_success(
    client: TestClient, db_session: Session, many_productions
):
    response = client.get(BASE_URL + "/", params={"limit": 5})
    assert response.status_code == 200

    # Check first page.
    data = response.json()
    assert len(data["productions"]) == 5
    next_cursor = data["pagination"]["next_cursor"]
    assert next_cursor is not None
    assert data["pagination"]["has_more"]

    response = client.get(BASE_URL + "/", params={"cursor": next_cursor, "limit": 5})
    assert response.status_code == 200

    # Check second (last) page.
    data = response.json()
    assert len(data["productions"]) == 5
    assert data["pagination"]["next_cursor"] is None
    assert not data["pagination"]["has_more"]


# User gets empty list because no productions in database.
def test_get_productions_empty(client: TestClient, db_session: Session):
    response = client.get(BASE_URL + "/", params={"limit": 5})
    assert response.status_code == 200

    data = response.json()
    assert len(data["productions"]) == 0
    next_cursor = data["pagination"]["next_cursor"]
    assert next_cursor is None
    assert not data["pagination"]["has_more"]


# When no language specified, user should get all info's with a certain production.
def test_get_production_by_id_all_infos(
    client: TestClient, db_session: Session, productions_limited
):
    id = productions_limited[0].id
    response = client.get(
        BASE_URL + f"/{id}",
    )
    assert response.status_code == 200

    data = response.json()
    assert len(data["production_infos"]) == 2


# When a valid language is specified, user should get only that info with a certain production.
def test_get_production_by_id_valid_language(
    client: TestClient, db_session: Session, productions_limited
):
    id = productions_limited[0].id
    response = client.get(
        BASE_URL + f"/{id}",
        headers={"Accept-Language": "nl"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["production_infos"]) == 1
    assert data["production_infos"][0]["title"] == "prod1_nl"


# When an invalid language is specified, user should get all existing languages.
def test_get_production_by_id_invalid_language(
    client: TestClient, db_session: Session, productions_limited
):
    id = productions_limited[0].id
    response = client.get(
        BASE_URL + f"/{id}",
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["production_infos"]) == 2


# Invalid id results in a 404.
def test_get_production_by_id_invalid(
    client: TestClient, db_session: Session, productions_limited
):
    id = 1025
    response = client.get(
        BASE_URL + f"/{id}",
    )
    assert response.status_code == 404


# User with permissions should be able to update existing production.
def test_patch_production_success(
    client: TestClient, db_session: Session, productions_limited
):
    headers = create_user_and_login(
        client, db_session, "update_production_user", [Permissions.ARCHIVE_UPDATE]
    )
    production = productions_limited[0]
    assert production.performer_type == "theater"

    response = client.patch(
        f"{BASE_URL}/{production.id}",
        json={
            "performer_type": "concert",
        },
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["performer_type"] == "concert"


# User without permissions should not be able to update existing production.
def test_patch_production_failure(
    client: TestClient, db_session: Session, productions_limited
):
    headers = create_user_and_login(
        client, db_session, "create_production_user", [Permissions.ARCHIVE_CREATE]
    )  # User can only create.
    production = productions_limited[0]
    assert production.performer_type == "theater"

    response = client.patch(
        f"{BASE_URL}/{production.id}",
        json={
            "performer_type": "concert",
        },
        headers=headers,
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Incorrect permissions"


# User cannot update a non existing production.
def test_patch_production_not_found(
    client: TestClient, db_session, productions_limited
):
    headers = create_user_and_login(
        client, db_session, "update_production_user", [Permissions.ARCHIVE_UPDATE]
    )
    production = productions_limited[0]
    assert production.performer_type == "theater"

    response = client.patch(
        f"{BASE_URL}/100",
        json={
            "performer_type": "concert",
        },
        headers=headers,
    )

    assert response.status_code == 404


# User with permissions can add a new info to an existing production.
def test_patch_production_add_info_success(
    client: TestClient, db_session: Session, productions_limited
):
    headers = create_user_and_login(
        client, db_session, "update_production_user", [Permissions.ARCHIVE_UPDATE]
    )
    production = productions_limited[1]

    response = client.patch(
        f"{BASE_URL}/{production.id}",
        json={"production_infos": [{"language": "en", "title": "prod2_en"}]},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["production_infos"]) == 2


# User with permissions cannot add a new info to an existing production for an invalid language.
def test_patch_production_add_info_invalid_language(
    client: TestClient, db_session: Session, productions_limited
):
    headers = create_user_and_login(
        client, db_session, "update_production_user", [Permissions.ARCHIVE_UPDATE]
    )
    production = productions_limited[1]

    response = client.patch(
        f"{BASE_URL}/{production.id}",
        json={"production_infos": [{"language": "es", "title": "prod2_en"}]},
        headers=headers,
    )

    assert response.status_code == 404


# User with permissions can delete an existing info of an existing production.
def test_patch_production_delete_info_success(
    client: TestClient, db_session: Session, productions_limited
):
    headers = create_user_and_login(
        client, db_session, "update_production_user", [Permissions.ARCHIVE_UPDATE]
    )
    production = productions_limited[0]

    response = client.patch(
        f"{BASE_URL}/{production.id}",
        json={"remove_languages": ["en"]},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["production_infos"]) == 1


# User should be able to create a new production.
def test_create_production_success(
    client: TestClient, db_session: Session, language_nl
):
    headers = create_user_and_login(
        client, db_session, "create_production_user", [Permissions.ARCHIVE_CREATE]
    )
    response = client.post(
        BASE_URL + "/",
        json={
            "performer_type": "band",
            "attendance_mode": "offline",
            "media_gallery_id": 4,
            "production_info": {"language": "nl", "title": "Nieuwe productie"},
        },
        headers=headers,
    )

    assert response.status_code == 201
    data = response.json()
    print(data)
    assert data["performer_type"] == "band"
    assert data["attendance_mode"] == "offline"


# User should not be able to create a new production because of permissions.
def test_create_production_failure(
    client: TestClient, db_session: Session, language_nl
):
    response = client.post(
        BASE_URL + "/",
        json={
            "performer_type": "band",
            "attendance_mode": "offline",
            "media_gallery_id": 4,
            "production_info": {"language": "nl", "title": "Nieuwe productie"},
        },
    )

    assert response.status_code == 401


# User should not be able to create a new production because of unsupported lanuage.
def test_create_production_unsupported_language(
    client: TestClient, db_session: Session, language_nl
):
    headers = create_user_and_login(
        client, db_session, "create_production_user", [Permissions.ARCHIVE_CREATE]
    )
    response = client.post(
        BASE_URL + "/",
        json={
            "performer_type": "band",
            "attendance_mode": "offline",
            "media_gallery_id": 4,
            "production_info": {"language": "en", "title": "new production"},
        },
        headers=headers,
    )
    assert response.status_code == 404


# User with permissions should be able to delete an existing production.
def test_delete_production_success(
    client: TestClient, db_session: Session, productions_limited
):
    headers = create_user_and_login(
        client, db_session, "delete_production_user", [Permissions.ARCHIVE_DELETE]
    )
    response = client.delete(f"{BASE_URL}/{productions_limited[0].id}", headers=headers)
    assert response.status_code == 204


# User without permissions should not be able to delete an existing production.
def test_delete_production_failure(
    client: TestClient, db_session: Session, productions_limited
):
    headers = create_user_and_login(
        client, db_session, "create_production_user", [Permissions.ARCHIVE_CREATE]
    )  # User can only create.
    response = client.delete(f"{BASE_URL}/{productions_limited[0].id}", headers=headers)
    assert response.status_code == 403


# User cannot delete a not existing production.
def test_delete_production_not_found(
    client: TestClient, db_session: Session, productions_limited
):
    headers = create_user_and_login(
        client, db_session, "delete_production_user", [Permissions.ARCHIVE_DELETE]
    )
    response = client.delete(f"{BASE_URL}/100", headers=headers)
    assert response.status_code == 404
