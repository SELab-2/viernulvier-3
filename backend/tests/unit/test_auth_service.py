from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import HTTPException
from src.config import settings
from src.models.permission import Permission
from src.models.role import Role
from src.models.user import User
from src.services.auth.password import get_password_hash, verify_password
from src.services.auth.token import (
    build_token_data,
    create_access_token,
    create_refresh_token,
    decode_access_token,
)


def test_password_hashing():
    password = "secret_password"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False


def test_token_creation_and_decoding():
    perm = Permission(name="test:perm")
    role = Role(name="test_role", permissions=[perm])
    user = User(id=123, username="testuser", roles=[role], token_version=7)

    token_data = build_token_data(user)
    access_token = create_access_token(data=token_data)

    decoded = decode_access_token(access_token)
    assert decoded.user_id == 123
    assert "test_role" in decoded.roles
    assert "test:perm" in decoded.permissions
    assert decoded.token_version == 7


def test_refresh_token_creation():
    data = {"sub": "123", "token_version": 4, "type": "refresh"}
    refresh_token = create_refresh_token(data=data)
    payload = jwt.decode(
        refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
    )
    assert payload["sub"] == "123"
    assert payload["token_version"] == 4
    assert payload["type"] == "refresh"


def test_token_without_version_defaults_to_zero():
    access_token = create_access_token(
        data={"sub": "123", "roles": [], "permissions": [], "type": "access"}
    )
    decoded = decode_access_token(access_token)

    assert decoded.user_id == 123
    assert decoded.token_version == 0


def test_invalid_token():
    with pytest.raises(HTTPException) as excinfo:
        decode_access_token("invalid_token")
    assert excinfo.value.status_code == 401


def test_expired_token():
    data = {
        "sub": "123",
        "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
    }
    expired_token = jwt.encode(
        data, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    with pytest.raises(HTTPException) as excinfo:
        decode_access_token(expired_token)
    assert excinfo.value.status_code == 401
    assert "Could not validate credentials" in str(excinfo.value.detail)


def test_token_missing_sub():
    data = {"roles": [], "permissions": []}
    token = jwt.encode(data, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    with pytest.raises(HTTPException) as excinfo:
        decode_access_token(token)
    assert excinfo.value.status_code == 401


def test_token_with_non_numeric_sub():
    data = {"sub": "testuser", "roles": [], "permissions": []}
    token = jwt.encode(data, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    with pytest.raises(HTTPException) as excinfo:
        decode_access_token(token)
    assert excinfo.value.status_code == 401
