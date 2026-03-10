from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from src.models.user import User
from src.schemas.auth import UserPatch
from src.services.auth import user as user_service
from src.services.auth.password import get_password_hash
from src.services.auth.token import decode_access_token


def test_login_integration(client: TestClient, db_session: Session):
    password = "login_int_pw"
    hashed = get_password_hash(password)
    user = User(username="login_int_user", hashed_password=hashed)
    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/api/v1/auth/login/",
        json={"username": "login_int_user", "password": password},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert decode_access_token(data["access_token"]).user_id == user.id
    assert decode_access_token(data["refresh_token"]).user_id == user.id


def test_login_integration_fail(client: TestClient):
    response = client.post(
        "/api/v1/auth/login/",
        json={"username": "non_existent", "password": "password"},
    )
    assert response.status_code == 401


def test_get_me_integration(client: TestClient, db_session: Session):
    password = "me_int_pw"
    hashed = get_password_hash(password)
    user = User(username="me_int_user", hashed_password=hashed)
    db_session.add(user)
    db_session.commit()

    login_response = client.post(
        "/api/v1/auth/login/",
        json={"username": "me_int_user", "password": password},
    )
    token = login_response.json()["access_token"]

    response = client.get(
        "/api/v1/auth/users/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "me_int_user"


def test_refresh_token_integration(client: TestClient, db_session: Session):
    password = "refresh_int_pw"
    hashed = get_password_hash(password)
    user = User(username="refresh_int_user", hashed_password=hashed)
    db_session.add(user)
    db_session.commit()

    login_response = client.post(
        "/api/v1/auth/login/",
        json={"username": "refresh_int_user", "password": password},
    )
    refresh_token = login_response.json()["refresh_token"]

    response = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert decode_access_token(data["access_token"]).user_id == user.id


def test_tokens_invalidated_after_password_change_integration(
    client: TestClient, db_session: Session
):
    password = "invalidate_int_pw"
    hashed = get_password_hash(password)
    user = User(username="invalidate_int_user", hashed_password=hashed)
    db_session.add(user)
    db_session.commit()

    login_response = client.post(
        "/api/v1/auth/login/",
        json={"username": "invalidate_int_user", "password": password},
    )
    access_token = login_response.json()["access_token"]
    refresh_token = login_response.json()["refresh_token"]

    user_service.patch_user(
        db_session,
        user.id,
        UserPatch(password="new-password"),
    )

    me_response = client.get(
        "/api/v1/auth/users/me", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert me_response.status_code == 401

    refresh_response = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert refresh_response.status_code == 401
