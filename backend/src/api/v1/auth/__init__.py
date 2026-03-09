from fastapi import APIRouter
from src.api.v1.auth import login, users, permissions
from src.api.v1.auth import roles

router = APIRouter()

router.include_router(login.router, tags=["Login"])

router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(permissions.router, prefix="/permissions", tags=["Permissions"])
router.include_router(roles.router, prefix="/roles", tags=["Roles"])
