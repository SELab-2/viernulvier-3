from datetime import datetime, timezone
from typing import Optional

import jwt
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from src.config import settings
from src.models.user import User
from src.schemas.auth import AccessTokenResponse, Token
from src.services.auth.password import verify_password
from src.services.auth.token import (
    build_token_data,
    create_access_token,
    create_refresh_token,
)
from src.services.auth.user import get_user


def authenticate_user(
    db: Session, username: str, password: str
) -> Optional[User]:
    user = get_user(db, username=username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def login_user(db: Session, username: str, password: str) -> Token:
    user = authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data=build_token_data(user))
    refresh_token = create_refresh_token(data={"sub": user.username})
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    return Token(access_token=access_token, refresh_token=refresh_token)


def refresh_access_token(
    db: Session, refresh_token: str
) -> AccessTokenResponse:
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
    )
    try:
        payload = jwt.decode(
            refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise invalid
    except jwt.PyJWTError:
        raise invalid

    user = get_user(db, username=username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    access_token = create_access_token(data=build_token_data(user))
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    return AccessTokenResponse(access_token=access_token)
