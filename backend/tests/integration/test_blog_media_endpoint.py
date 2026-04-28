import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from src.services.auth.password import get_password_hash
from src.services.auth.permissions import Permissions
from src.models.user import User
from src.models.role import Role
from src.models.permission import Permission

BASE_URL = "/api/v1/archive/blogs"


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


@pytest.mark.parametrize(
    "content_type", ["image/jpeg", "image/png", "image/webp", "image/gif"]
)
def test_upload_media_success(
    client: TestClient, db_session: Session, blog_with_no_media, content_type: str
):
    """Test media upload - matches MediaResponse schema exactly."""
    headers = create_user_and_login(
        client, db_session, "upload_user", [Permissions.BLOG_CREATE]
    )

    test_file = ("test.jpg", io.BytesIO(b"fake image data"), content_type)

    response = client.post(
        f"{BASE_URL}/{blog_with_no_media.id}/media/",
        files={"file": test_file},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()

    # Exact MediaResponse schema validation
    assert data["content_type"] == content_type
    assert "id_url" in data
    assert "blog_id_url" in data
    assert "uploaded_at" in data
    assert "url" in data

    # Verify blog relationship
    assert f"blogs/{blog_with_no_media.id}" in data["blog_id_url"]
    assert f"blogs/{blog_with_no_media.id}/media/" in data["id_url"]


def test_upload_media_unsupported_type(
    client: TestClient, db_session: Session, blog_with_no_media
):
    headers = create_user_and_login(
        client, db_session, "upload_user", [Permissions.BLOG_CREATE]
    )

    test_file = ("test.pdf", io.BytesIO(b"fake pdf"), "application/pdf")

    response = client.post(
        f"{BASE_URL}/{blog_with_no_media.id}/media/",
        files={"file": test_file},
        headers=headers,
    )
    assert response.status_code == 415
    assert "niet toegestaan" in response.json()["detail"]


def test_upload_media_no_permission(
    client: TestClient, db_session: Session, blog_with_no_media
):
    headers = create_user_and_login(client, db_session, "no_perm_user")

    test_file = ("test.jpg", io.BytesIO(b"fake"), "image/jpeg")

    response = client.post(
        f"{BASE_URL}/{blog_with_no_media.id}/media/",
        files={"file": test_file},
        headers=headers,
    )
    assert response.status_code == 403


def test_list_media(client: TestClient, media_items_for_blog):
    blog_id = media_items_for_blog[0].blog_id
    response = client.get(f"{BASE_URL}/{blog_id}/media/")
    assert response.status_code == 200
    data = response.json()

    assert len(data["media"]) == 3
    assert data["pagination"]["total_count"] == 3
    assert data["pagination"]["has_more"] is False
    assert data["pagination"]["next_cursor"] is None

    blog_path = f"blogs/{blog_id}"
    for item in data["media"]:
        assert "content_type" in item
        assert "id_url" in item
        assert "blog_id_url" in item
        assert blog_path in item["blog_id_url"]


def test_delete_media_success(client: TestClient, db_session: Session, media_item_blog):
    headers = create_user_and_login(
        client, db_session, "delete_user", [Permissions.BLOG_DELETE]
    )

    response = client.delete(
        f"{BASE_URL}/{media_item_blog.blog_id}/media/{media_item_blog.id}",
        headers=headers,
    )
    assert response.status_code == 204


def test_delete_media_no_permission(
    client: TestClient, db_session: Session, media_item_blog
):
    headers = create_user_and_login(client, db_session, "no_perm_user")

    response = client.delete(
        f"{BASE_URL}/{media_item_blog.blog_id}/media/{media_item_blog.id}",
        headers=headers,
    )
    assert response.status_code == 403


def test_delete_media_not_found(
    client: TestClient, db_session: Session, blog_with_no_media
):
    headers = create_user_and_login(
        client, db_session, "delete_user", [Permissions.BLOG_DELETE]
    )

    response = client.delete(
        f"{BASE_URL}/{blog_with_no_media.id}/media/999", headers=headers
    )
    assert response.status_code == 404
    assert "Media" in response.json()["detail"]


def test_list_media_pagination(client: TestClient, media_items_for_blog):
    blog_id = media_items_for_blog[0].blog_id

    page1 = client.get(f"{BASE_URL}/{blog_id}/media/?limit=2").json()
    assert len(page1["media"]) == 2
    assert page1["pagination"]["total_count"] == 3
    assert page1["pagination"]["has_more"] is True
    next_cursor = page1["pagination"]["next_cursor"]
    assert next_cursor is not None

    page2 = client.get(
        f"{BASE_URL}/{blog_id}/media/?cursor={next_cursor}&limit=2"
    ).json()
    assert page2["pagination"]["total_count"] == 3
    assert len(page2["media"]) == 1
    assert page2["pagination"]["has_more"] is False


def test_list_media_invalid_cursor(client: TestClient, media_items_for_blog):
    blog_id = media_items_for_blog[0].blog_id
    response = client.get(f"{BASE_URL}/{blog_id}/media/?cursor=notanumber")
    assert response.status_code == 422


def test_list_media_invalid_limit(client: TestClient, media_items_for_blog):
    blog_id = media_items_for_blog[0].blog_id
    response = client.get(f"{BASE_URL}/{blog_id}/media/?limit=0")
    assert response.status_code == 422
