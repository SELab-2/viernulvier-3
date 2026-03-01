from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.api.dependencies import get_db
from src.schemas.auth import (
    LoginRequest,
    Token,
    TokenRefreshRequest,
    AccessTokenResponse,
)
from src.services import auth as auth_service

router = APIRouter()


@router.post(
    "/",
    response_model=Token,
    summary="User login",
    description="Authenticates a user and returns access and refresh tokens.",
)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login_user(db, credentials.username, credentials.password)


@router.post(
    "/refresh",
    response_model=AccessTokenResponse,
    summary="Refresh access token",
    description="Uses a refresh token to obtain a new access token.",
)
def refresh_token(request: TokenRefreshRequest, db: Session = Depends(get_db)):
    return auth_service.refresh_access_token(db, request.refresh_token)
