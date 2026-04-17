from typing import List

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from src.api.dependencies import RequirePermissions, get_current_user
from src.database import get_db
from src.models.user import User
from src.schemas.auth import UserCreate, UserPatch, UserReplace, UserResponse
from src.services.archive import get_base_url
from src.services.auth import permissions as permission_service
from src.services.auth import user as user_service

router = APIRouter()


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Returns the profile information, roles,"
    "and permissions of the currently authenticated user.",
)
def get_current_user_profile(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    base_url = get_base_url(str(request.url), 2)
    return user_service.get_user_profile(current_user, base_url)


@router.get(
    "/",
    response_model=List[UserResponse],
    summary="List all users",
    description="Returns all users with their roles and permissions.",
)
def list_users(
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([permission_service.Permissions.USERS_READ])),
) -> List[UserResponse]:
    base_url = get_base_url(str(request.url), 2)
    return user_service.list_users(db, base_url)


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a user",
    description="Create a new user with a password and optional roles.",
)
def create_user(
    user: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(
        RequirePermissions([permission_service.Permissions.USERS_CREATE])
    ),
) -> UserResponse:
    base_url = get_base_url(str(request.url), 2)
    return user_service.create_user(db, user, base_url)


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get a user",
    description="Get a user by ID.",
)
def get_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([permission_service.Permissions.USERS_READ])),
) -> UserResponse:
    base_url = get_base_url(str(request.url), 2)
    return user_service.get_user_detail(db, user_id, base_url)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Replace a user",
    description="Replace a user's username, password, and roles.",
)
def replace_user(
    user_id: int,
    replacement: UserReplace,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(
        RequirePermissions([permission_service.Permissions.USERS_UPDATE])
    ),
) -> UserResponse:
    base_url = get_base_url(str(request.url), 2)
    return user_service.replace_user(db, user_id, replacement, base_url)


@router.patch(
    "/{user_id}",
    response_model=UserResponse,
    summary="Patch a user",
    description="Update one or more user fields without replacing the full resource.",
)
def patch_user(
    user_id: int,
    update: UserPatch,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(
        RequirePermissions([permission_service.Permissions.USERS_UPDATE])
    ),
) -> UserResponse:
    base_url = get_base_url(str(request.url), 2)
    return user_service.patch_user(db, user_id, update, base_url)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a user",
    description="Delete a user by ID.",
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        RequirePermissions([permission_service.Permissions.USERS_DELETE])
    ),
) -> None:
    user_service.delete_user(db, user_id, current_user)
