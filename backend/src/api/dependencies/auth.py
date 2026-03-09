from typing import List

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.services import auth as auth_service

security_scheme = HTTPBearer()


def get_current_user(
    db: Session = Depends(get_db),
    token: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = auth_service.decode_access_token(token.credentials)
    user = auth_service.get_user_by_id(db, user_id=token_data.user_id)
    if user is None or user.token_version != token_data.token_version:
        raise credentials_exception
    return user


class RequirePermissions:
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = set(required_permissions)

    def __call__(self, current_user: User = Depends(get_current_user)):
        user_permissions = set()
        for role in current_user.roles:
            for perm in role.permissions:
                user_permissions.add(perm.name)

        if not self.required_permissions.issubset(user_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Incorrect permissions",
            )
        return current_user
