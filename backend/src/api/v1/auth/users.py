from fastapi import APIRouter, Depends
from src.api.dependencies import get_current_user
from src.models.user import User
from src.schemas.auth import UserResponse
from src.services.auth import user as user_service

router = APIRouter()


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Returns the profile information, roles,"
                "and permissions of the currently authenticated user.",
)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return user_service.get_user_profile(current_user)
