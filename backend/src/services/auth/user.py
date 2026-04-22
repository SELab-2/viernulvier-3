from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from src.models.role import Role
from src.models.user import User
from src.schemas.auth import UserCreate, UserPatch, UserReplace, UserResponse
from src.services.auth.password import get_password_hash
from src.services.auth.permissions import Permissions


def get_user(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def _get_user_or_404(db: Session, user_id: int) -> User:
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user


def _ensure_username_is_available(db: Session, user_id: int, username: str) -> None:
    if db.query(User).filter(User.username == username, User.id != user_id).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Username already exists"
        )


def _commit_user_changes(db: Session, user: User, base_url: str) -> UserResponse:
    db.commit()
    db.refresh(user)
    return _to_user_response(user, base_url)


def get_user_permission_names(user: User) -> List[str]:
    if user.super_user:
        return sorted(Permissions.all())

    return sorted(
        {permission.name for role in user.roles for permission in role.permissions}
    )


def _to_user_response(user: User, base_url: str) -> UserResponse:
    roles = sorted(role.name for role in user.roles)
    return UserResponse(
        id=user.id,
        id_url=f"{base_url}/auth/users/{user.id}",
        username=user.username,
        super_user=user.super_user,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        roles=roles,
        permissions=get_user_permission_names(user),
    )


def _get_roles_by_name(db: Session, role_names: List[str]) -> List[Role]:
    unique_role_names = list(dict.fromkeys(role_names))
    if not unique_role_names:
        return []

    roles = db.query(Role).filter(Role.name.in_(unique_role_names)).all()
    roles_by_name = {role.name: role for role in roles}
    missing_roles = [name for name in unique_role_names if name not in roles_by_name]
    if missing_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid roles: {', '.join(missing_roles)}",
        )
    return [roles_by_name[name] for name in unique_role_names]


def list_users(db: Session, base_url: str) -> List[UserResponse]:
    users = db.query(User).order_by(User.id).all()
    return [_to_user_response(user, base_url) for user in users]


def create_user(db: Session, user: UserCreate, base_url: str) -> UserResponse:
    if get_user(db, user.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Username already exists"
        )

    db_user = User(
        username=user.username,
        hashed_password=get_password_hash(user.password),
        roles=_get_roles_by_name(db, user.roles),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return _to_user_response(db_user, base_url)


def get_user_detail(db: Session, user_id: int, base_url) -> UserResponse:
    return _to_user_response(_get_user_or_404(db, user_id), base_url)


def replace_user(
    db: Session, user_id: int, replacement: UserReplace, base_url: str
) -> UserResponse:
    user = _get_user_or_404(db, user_id)

    if replacement.username != user.username:
        _ensure_username_is_available(db, user_id, replacement.username)

    user.username = replacement.username
    user.hashed_password = get_password_hash(replacement.password)
    user.token_version += 1
    user.roles = _get_roles_by_name(db, replacement.roles)

    return _commit_user_changes(db, user, base_url)


def patch_user(
    db: Session, user_id: int, update: UserPatch, base_url: str
) -> UserResponse:
    user = _get_user_or_404(db, user_id)

    if "username" in update.model_fields_set and update.username is not None:
        if update.username != user.username:
            _ensure_username_is_available(db, user_id, update.username)
        user.username = update.username

    if "password" in update.model_fields_set and update.password is not None:
        user.hashed_password = get_password_hash(update.password)
        user.token_version += 1

    if "roles" in update.model_fields_set and update.roles is not None:
        user.roles = _get_roles_by_name(db, update.roles)

    return _commit_user_changes(db, user, base_url)


def delete_user(db: Session, user_id: int, current_user: User) -> None:
    user = _get_user_or_404(db, user_id)

    if user.super_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super users cannot be deleted",
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot delete your own account",
        )

    db.delete(user)
    db.commit()


def get_user_profile(user: User, base_url: str) -> UserResponse:
    return _to_user_response(user, base_url)
