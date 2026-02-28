import pytest
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from src.config import settings
from src.services.auth.password import get_password_hash, verify_password
from src.services.auth.token import create_access_token, create_refresh_token, decode_access_token, build_token_data
from src.models.user import User
from src.models.role import Role
from src.models.permission import Permission

def test_password_hashing():
    password = "secret_password"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_token_creation_and_decoding():
    perm = Permission(name="test:perm")
    role = Role(name="test_role", permissions=[perm])
    user = User(username="testuser", roles=[role])
    
    token_data = build_token_data(user)
    access_token = create_access_token(data=token_data)
    
    decoded = decode_access_token(access_token)
    assert decoded.username == "testuser"
    assert "test_role" in decoded.roles
    assert "test:perm" in decoded.permissions

def test_refresh_token_creation():
    data = {"sub": "testuser"}
    refresh_token = create_refresh_token(data=data)
    decoded = decode_access_token(refresh_token)
    assert decoded.username == "testuser"

def test_invalid_token():
    with pytest.raises(Exception):
        decode_access_token("invalid_token")

def test_expired_token():
    data = {"sub": "testuser", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)}
    expired_token = jwt.encode(data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    with pytest.raises(HTTPException) as excinfo:
        decode_access_token(expired_token)
    assert excinfo.value.status_code == 401
    assert "Could not validate credentials" in str(excinfo.value.detail)

def test_token_missing_sub():
    data = {"roles": [], "permissions": []}
    token = jwt.encode(data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    with pytest.raises(HTTPException) as excinfo:
        decode_access_token(token)
    assert excinfo.value.status_code == 401
