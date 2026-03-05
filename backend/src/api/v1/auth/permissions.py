from fastapi import APIRouter, Depends
from typing import List
from src.schemas.auth import PermissionResponse
from src.services.auth.permissions import Permissions
from src.api.dependencies.auth import RequirePermissions

router = APIRouter()


@router.get(
    "/",
    response_model=List[PermissionResponse],
    summary="List all possible permissions",
    description="Returns all permissions defined in the application. Requires users:read permission.",
)
def list_permissions(
    _=Depends(RequirePermissions([Permissions.USERS_READ])),
) -> List[PermissionResponse]:
    return [
        PermissionResponse(id=i + 1, name=name)
        for i, name in enumerate(Permissions.all())
    ]
