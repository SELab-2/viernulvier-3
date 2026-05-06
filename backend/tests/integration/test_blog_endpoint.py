from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from src.models.user import User
from src.models.role import Role
from src.services.auth.password import get_password_hash
from src.services.auth.permissions import Permissions
from src.services.language import Languages

BASE_PROD_URL = "/api/v1/archive/productions"
BASE_BLOG_URL = "/api/v1/archive/blogs"


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


# Any user should be able to get all existing blogs (with pagination).
def test_get_blogs_success(client: TestClient, db_session: Session, many_blogs):
    response = client.get(BASE_BLOG_URL + "/", params={"limit": 5})
    assert response.status_code == 200

    # Check first page.
    data = response.json()
    assert len(data["blogs"]) == 5
    assert data["pagination"]["total_count"] == 10
    next_cursor = data["pagination"]["next_cursor"]
    assert next_cursor is not None
    assert data["pagination"]["has_more"]

    response = client.get(
        BASE_BLOG_URL + "/", params={"cursor": next_cursor, "limit": 5}
    )
    assert response.status_code == 200

    # Check second (last) page.
    data = response.json()
    assert len(data["blogs"]) == 5
    assert data["pagination"]["total_count"] == 10
    assert data["pagination"]["next_cursor"] is None
    assert not data["pagination"]["has_more"]


# User gets empty list because no blogs in database.
def test_get_blogs_empty(client: TestClient, db_session: Session):
    response = client.get(BASE_BLOG_URL + "/", params={"limit": 5})
    assert response.status_code == 200

    data = response.json()
    assert len(data["blogs"]) == 0
    next_cursor = data["pagination"]["next_cursor"]
    assert next_cursor is None
    assert not data["pagination"]["has_more"]


# When no language specified, user should get all content's with a certain blog.
def test_get_blog_by_id_all_contents(
    client: TestClient, db_session: Session, blogs_limited
):
    id = blogs_limited[1].id
    response = client.get(
        BASE_BLOG_URL + f"/{id}",
    )
    assert response.status_code == 200

    data = response.json()
    assert len(data["blog_contents"]) == 2


# When a valid language is specified, user should get only that content with a certain blog.
def test_get_blog_by_id_valid_language(
    client: TestClient, db_session: Session, blogs_limited
):
    id = blogs_limited[1].id
    response = client.get(
        BASE_BLOG_URL + f"/{id}",
        headers={"Accept-Language": Languages.NEDERLANDS},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["blog_contents"]) == 1
    assert data["blog_contents"][0]["title"] == "titel2"


# When an invalid language is specified, user should get all existing languages.
def test_get_blog_by_id_invalid_language(
    client: TestClient, db_session: Session, blogs_limited
):
    id = blogs_limited[1].id
    response = client.get(
        BASE_BLOG_URL + f"/{id}",
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["blog_contents"]) == 2


# Invalid id results in a 404.
def test_get_blog_by_id_invalid(client: TestClient, db_session: Session, blogs_limited):
    id = 1025
    response = client.get(
        BASE_BLOG_URL + f"/{id}",
    )
    assert response.status_code == 404


# User with permissions should be able to update existing blog.
def test_patch_blog_success(client: TestClient, db_session: Session, blogs_limited):
    headers = create_user_and_login(
        client, db_session, "update_blog_user", [Permissions.BLOG_UPDATE]
    )
    blog = blogs_limited[0]
    assert blog.contents[0].title == "title1"

    response = client.patch(
        f"{BASE_BLOG_URL}/{blog.id}",
        json={
            "blog_contents": [{"language": "en", "title": "new_title"}],
        },
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["blog_contents"][0]["title"] == "new_title"


# User without permissions should not be able to update existing blog.
def test_patch_blog_failure(client: TestClient, db_session: Session, blogs_limited):
    headers = create_user_and_login(
        client, db_session, "update_blog_user", [Permissions.BLOG_CREATE]
    )
    blog = blogs_limited[0]
    assert blog.contents[0].title == "title1"

    response = client.patch(
        f"{BASE_BLOG_URL}/{blog.id}",
        json={
            "blog_contents": [{"title": "new_title"}],
        },
        headers=headers,
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Incorrect permissions"


# User can change productions of a blog if all given productions exist.
def test_patch_blog_productions_success(
    client: TestClient, db_session: Session, blogs_limited
):
    headers = create_user_and_login(
        client, db_session, "update_blog_user", [Permissions.BLOG_UPDATE]
    )
    id = blogs_limited[0].id
    response = client.get(
        BASE_BLOG_URL + f"/{id}",
    )

    data = response.json()
    assert {
        int(production_url.rstrip("/").split("/")[-1])
        for production_url in data["production_id_urls"]
    } == {1}

    response = client.patch(
        f"{BASE_BLOG_URL}/{id}",
        json={
            "production_id_urls": [
                f"{BASE_PROD_URL}/{production_id}" for production_id in (1, 2)
            ]
        },
        headers=headers,
    )

    # Updated in response.
    data = response.json()
    assert {
        int(production_url.rstrip("/").split("/")[-1])
        for production_url in data["production_id_urls"]
    } == {1, 2}

    response = client.get(
        BASE_BLOG_URL + f"/{id}",
    )

    # Updated in database.
    data = response.json()
    assert {
        int(production_url.rstrip("/").split("/")[-1])
        for production_url in data["production_id_urls"]
    } == {1, 2}


# User with permissions can delete an existing content of an existing blog.
def test_patch_blog_delete_content_success(
    client: TestClient, db_session: Session, blogs_limited
):
    headers = create_user_and_login(
        client, db_session, "update_blog_user", [Permissions.BLOG_UPDATE]
    )
    blog = blogs_limited[1]

    response = client.patch(
        f"{BASE_BLOG_URL}/{blog.id}",
        json={"remove_languages": [Languages.ENGLISH]},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["blog_contents"]) == 1


# User should be able to create a new blog with productions.
def test_create_blog_success(
    client: TestClient,
    db_session: Session,
    blogs_limited,
):
    headers = create_user_and_login(
        client, db_session, "create_blog_user", [Permissions.BLOG_CREATE]
    )
    response = client.post(
        BASE_BLOG_URL + "/",
        json={
            "blog_content": {
                "language": "nl",
                "title": "Nieuwe blog",
                "content": "Nieuwe content",
            },
            "production_id_urls": [
                f"{BASE_PROD_URL}/{production_id}" for production_id in (1, 2)
            ],
        },
        headers=headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert {
        int(production_url.rstrip("/").split("/")[-1])
        for production_url in data["production_id_urls"]
    } == {1, 2}
    assert data["blog_contents"][0]["title"] == "Nieuwe blog"


# User with permissions should be able to delete an existing blog.
def test_delete_blog_success(client: TestClient, db_session: Session, blogs_limited):
    headers = create_user_and_login(
        client, db_session, "delete_blog_user", [Permissions.BLOG_DELETE]
    )
    response = client.delete(f"{BASE_BLOG_URL}/{blogs_limited[0].id}", headers=headers)
    assert response.status_code == 204


# User without permissions should not be able to delete an existing blog.
def test_delete_blog_failure(client: TestClient, db_session: Session, blogs_limited):
    headers = create_user_and_login(
        client, db_session, "create_blog_user", [Permissions.BLOG_CREATE]
    )  # User can only create.
    response = client.delete(f"{BASE_BLOG_URL}/{blogs_limited[0].id}", headers=headers)
    assert response.status_code == 403
