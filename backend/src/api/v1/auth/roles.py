from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.user import User
from src.schemas.auth import RoleCreate, RoleUpdate, RoleResponse
from src.services.auth import role as role_service
from src.api.dependencies.auth import RequirePermissions
from src.services.auth.permissions import Permissions

router = APIRouter()


@router.get(
    "/",
    response_model=List[RoleResponse],
    summary="List all roles",
    description="Returns all roles with their permissions.",
)
def list_roles(
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.USERS_READ])),
) -> List[RoleResponse]:
    return role_service.list_roles(db)


@router.post(
    "/",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a role",
    description="Create a new role with optional permissions.",
)
def create_role(
    role: RoleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.USERS_CREATE])),
) -> RoleResponse:
    return role_service.create_role(db, role)


@router.get(
    "/{role_id}",
    response_model=RoleResponse,
    summary="Get a role",
    description="Get a role by its ID.",
)
def get_role(
    role_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.USERS_READ])),
) -> RoleResponse:
    return role_service.get_role(db, role_id)


@router.put(
    "/{role_id}",
    response_model=RoleResponse,
    summary="Update a role",
    description="Update a role's name or permissions.",
)
def update_role(
    role_id: int,
    update: RoleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.USERS_UPDATE])),
) -> RoleResponse:
    return role_service.update_role(db, role_id, update)


@router.delete(
    "/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a role",
    description="Delete a role by its ID.",
)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.USERS_DELETE])),
) -> None:
    role_service.delete_role(db, role_id)
