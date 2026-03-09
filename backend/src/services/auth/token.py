from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import HTTPException, status
from src.config import settings
from src.models.user import User
from src.schemas.auth import TokenData


def build_user_subject(user: User) -> str:
    if user.id is None:
        raise ValueError("Cannot issue a token for a user without an ID")
    return str(user.id)


def build_token_data(user: User) -> dict:
    roles = [role.name for role in user.roles]
    permissions = set()
    for role in user.roles:
        for perm in role.permissions:
            permissions.add(perm.name)
    return {
        "sub": build_user_subject(user),
        "roles": roles,
        "permissions": sorted(permissions),
    }


def get_token_subject_user_id(payload: dict) -> int:
    subject = payload.get("sub")
    if subject is None:
        raise ValueError("Token subject is missing")

    try:
        return int(subject)
    except (TypeError, ValueError) as exc:
        raise ValueError("Token subject must be a valid user ID") from exc


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def decode_access_token(token: str) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = get_token_subject_user_id(payload)
        return TokenData(
            user_id=user_id,
            roles=payload.get("roles", []),
            permissions=payload.get("permissions", []),
        )
    except (jwt.PyJWTError, ValueError) as exc:
        raise credentials_exception from exc
