from fastapi.testclient import TestClient
import pytest
from sqlalchemy.orm import Session

from src.models.user import User
from src.models.role import Role
from src.services.auth.password import get_password_hash
from src.services.auth.permissions import Permissions

TAGS_URL = "/api/v1/archive/tags"


@pytest.fixture
def create_headers(client: TestClient, db_session: Session):
    return create_user_and_login(
        client, db_session, "create_tag_user", permissions=[Permissions.ARCHIVE_CREATE]
    )


# gekopieerd van PR #42, kan deze niet beter in een aparte file?
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


def test_create_tag(client: TestClient, create_headers):
    response = client.post(
        TAGS_URL,
        json={
            "names": [
                {"language": "nl", "name": "tag1"},
            ]
        },
        headers=create_headers,
    )
    assert response.status_code == 201

    data = response.json()
    assert "id" in data
    assert len(data["names"]) == 1
    assert data["names"][0]["name"] == "tag1"


def test_create_tag_unauthorized(client: TestClient):
    response = client.post(
        TAGS_URL,
        json={
            "names": [
                {"language": "nl", "name": "tag1"},
            ]
        },
    )
    assert response.status_code == 401


def test_get_tag(
    client: TestClient, create_headers
):
    created_tag = client.post(
        TAGS_URL,
        json={
            "names": [
                {"language": "nl", "name": "tag1_nl"},
                {"language": "en", "name": "tag1_en"},
            ]
        },
        headers=create_headers,
    )

    tag_url = created_tag.json()["id"]
    tag_id = tag_url.split("/")[-1]

    response = client.get(f"{TAGS_URL}/{tag_id}")
    assert response.status_code == 200

    data = response.json()
    assert len(data["names"]) == 2

    # Test if nl header only gives nl tag
    response = client.get(f"{TAGS_URL}/{tag_id}", headers={"Accept-Language": "nl"})
    assert response.status_code == 200

    data = response.json()
    assert len(data["names"]) == 1
    assert data["names"][0]["name"] == "tag1_nl"

    # Test if en header only gives en tag
    response = client.get(f"{TAGS_URL}/{tag_id}", headers={"Accept-Language": "en"})
    assert response.status_code == 200

    data = response.json()
    assert len(data["names"]) == 1
    assert data["names"][0]["name"] == "tag1_en"


def test_get_tags(
    client: TestClient, create_headers
):
    n = 5
    for i in range(n):
        client.post(
            TAGS_URL,
            json={
                "names": [
                    {"language": "nl", "name": f"tag{i}_nl"},
                    {"language": "en", "name": f"tag{i}_en"},
                ]
            },
            headers=create_headers,
        )

    response = client.get(TAGS_URL, headers={"Accept-Language": "nl"})
    assert response.status_code == 200
    data = response.json()

    assert len(data) == n

    for i in range(n):
        assert len(data[i]["names"]) == 1
        # check if all tags are present in list of tags (independent of order)
        assert any(data[j]["names"][0]["name"] == f"tag{i}_nl" for j in range(n))


def test_patch_tag(
    client: TestClient,
    db_session: Session,
    create_headers
):
    created_tag = client.post(
        TAGS_URL,
        json={"names": [{"language": "nl", "name": "tag1"}]},
        headers=create_headers,
    )
    tag_id = created_tag.json()["id"].split("/")[-1]

    patch_headers = create_user_and_login(
        client, db_session, "patch_tag_user", permissions=[Permissions.ARCHIVE_UPDATE]
    )
    response = client.patch(
        f"{TAGS_URL}/{tag_id}",
        json={
            "names": [
                {"language": "nl", "name": "tag1_updated"},
                {"language": "en", "name": "tag1_en"},
            ]
        },
        headers=patch_headers,
    )
    assert response.status_code == 200

    data = response.json()
    assert len(data["names"]) == 2

    names = {n["language"]: n["name"] for n in data["names"]}
    assert names["nl"] == "tag1_updated"
    assert names["en"] == "tag1_en"


def test_patch_tag_unauthorized(
    client: TestClient, create_headers
):
    created_tag = client.post(
        TAGS_URL,
        json={"names": [{"language": "nl", "name": "tag1"}]},
        headers=create_headers,
    )
    tag_id = created_tag.json()["id"].split("/")[-1]

    response = client.patch(
        f"{TAGS_URL}/{tag_id}",
        json={
            "names": [
                {"language": "nl", "name": "tag1_updated"},
                {"language": "en", "name": "tag1_en"},
            ]
        },
    )
    assert response.status_code == 401

    get_response = client.get(f"{TAGS_URL}/{tag_id}")
    data = get_response.json()
    assert len(data["names"]) == 1

    names = {n["language"]: n["name"] for n in data["names"]}
    assert names["nl"] == "tag1"


def test_delete_tag(
    client: TestClient, db_session: Session, create_headers
):
    created_tag = client.post(
        TAGS_URL,
        json={"names": [{"language": "nl", "name": "tag1"}]},
        headers=create_headers,
    )

    tag_id = created_tag.json()["id"].split("/")[-1]

    delete_headers = create_user_and_login(
        client, db_session, "delete_tag_user", permissions=[Permissions.ARCHIVE_DELETE]
    )
    response = client.delete(f"{TAGS_URL}/{tag_id}", headers=delete_headers)
    assert response.status_code == 204

    get_response = client.get(f"{TAGS_URL}/{tag_id}")
    assert get_response.status_code == 404


def test_delete_unauthorized(client: TestClient, create_headers):
    created_tag = client.post(
        TAGS_URL,
        json={"names": [{"language": "nl", "name": "tag1"}]},
        headers=create_headers,
    )

    tag_id = created_tag.json()["id"].split("/")[-1]

    response = client.delete(f"{TAGS_URL}/{tag_id}")
    assert response.status_code == 401

    # Ensure tag is still present in database
    response = client.get(f"{TAGS_URL}/{tag_id}")
    assert response.status_code == 200


def test_tag_url_contains_full_path(
    client: TestClient, db_session: Session
):

    create_headers = create_user_and_login(
        client, db_session, "tag_url_user", permissions=[Permissions.ARCHIVE_CREATE]
    )

    response = client.post(
        TAGS_URL,
        json={
            "names": [
                {"language": "nl", "name": "tag_url_test"},
            ]
        },
        headers=create_headers,
    )
    assert response.status_code == 201
    data = response.json()

    tag_url = data.get("id")
    assert tag_url is not None

    assert "/api/v1/archive/tags" in tag_url

    tag_id = tag_url.split("/")[-1]
    assert str(tag_id) in tag_url

    names = data.get("names")
    assert names is not None
    assert any(n["name"] == "tag_url_test" for n in names)

    response = client.get(tag_url)
    assert response.status_code == 200
