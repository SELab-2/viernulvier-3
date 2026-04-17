import pytest
from sqlalchemy.orm import Session
from fastapi import HTTPException
from src.models.user import User
from src.schemas.auth import UserPatch
from src.schemas.auth import AccessTokenResponse, Token
from src.services.auth.flows import (
    authenticate_user,
    login_user,
    refresh_access_token,
)
from src.services.auth.password import get_password_hash
from src.services.auth.token import decode_access_token
from src.services.auth import user as user_service


def test_authenticate_user_success(db_session: Session):
    password = "testpassword"
    hashed = get_password_hash(password)
    user = User(username="auth_test", hashed_password=hashed)
    db_session.add(user)
    db_session.commit()

    auth_user = authenticate_user(db_session, "auth_test", password)
    assert auth_user is not None
    assert auth_user.username == "auth_test"


def test_authenticate_user_fail_wrong_password(db_session: Session):
    password = "testpassword"
    hashed = get_password_hash(password)
    user = User(username="auth_fail_pw", hashed_password=hashed)
    db_session.add(user)
    db_session.commit()

    auth_user = authenticate_user(db_session, "auth_fail_pw", "wrongpassword")
    assert auth_user is None


def test_authenticate_user_fail_nonexistent(db_session: Session):
    auth_user = authenticate_user(db_session, "no_user", "password")
    assert auth_user is None


def test_login_user_success(db_session: Session):
    password = "testpassword"
    hashed = get_password_hash(password)
    user = User(username="login_test", hashed_password=hashed)
    db_session.add(user)
    db_session.commit()

    token = login_user(db_session, "login_test", password)
    assert isinstance(token, Token)
    assert token.access_token is not None
    assert token.refresh_token is not None
    assert decode_access_token(token.access_token).user_id == user.id
    # assert decode_access_token(token.refresh_token).user_id == user.id


def test_refresh_access_token_success(db_session: Session):
    password = "testpassword"
    hashed = get_password_hash(password)
    user = User(username="refresh_test", hashed_password=hashed)
    db_session.add(user)
    db_session.commit()

    tokens = login_user(db_session, "refresh_test", password)

    new_access_token_resp = refresh_access_token(db_session, tokens.refresh_token)
    assert isinstance(new_access_token_resp, AccessTokenResponse)
    assert new_access_token_resp.access_token is not None
    assert decode_access_token(new_access_token_resp.access_token).user_id == user.id


def test_refresh_token_invalid_after_password_change(db_session: Session):
    password = "testpassword"
    hashed = get_password_hash(password)
    user = User(username="refresh_pw_change", hashed_password=hashed)
    db_session.add(user)
    db_session.commit()

    tokens = login_user(db_session, "refresh_pw_change", password)

    user_service.patch_user(
        db_session, user.id, UserPatch(password="newpassword"), base_url=""
    )

    with pytest.raises(HTTPException) as excinfo:
        refresh_access_token(db_session, tokens.refresh_token)

    assert excinfo.value.status_code == 401
    assert excinfo.value.detail == "Invalid refresh token"
