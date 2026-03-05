from typing import Optional

from sqlalchemy.orm import Session
from src.models.user import User
from src.schemas.auth import UserResponse


def get_user(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_profile(user: User) -> UserResponse:
    roles = [role.name for role in user.roles]
    permissions = set()
    for role in user.roles:
        for perm in role.permissions:
            permissions.add(perm.name)
    return UserResponse(
        id=user.id,
        username=user.username,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        roles=roles,
        permissions=sorted(permissions),
    )
