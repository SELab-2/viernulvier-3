from fastapi import APIRouter, Depends

from src.api.dependencies import get_current_user
from src.schemas.auth import UserResponse
from src.models.user import User

router = APIRouter()


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Returns the profile information, roles, and permissions of the currently authenticated user.",
)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    roles = [role.name for role in current_user.roles]
    permissions = set()
    for role in current_user.roles:
        for perm in role.permissions:
            permissions.add(perm.name)
    return {
        "id": current_user.id,
        "username": current_user.username,
        "created_at": current_user.created_at,
        "last_login_at": current_user.last_login_at,
        "roles": roles,
        "permissions": sorted(permissions),
    }
