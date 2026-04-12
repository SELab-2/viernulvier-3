from typing import List

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from src.api.dependencies.auth import RequirePermissions
from src.database import get_db
from src.models.user import User
from src.schemas.auth import RoleCreate, RoleResponse, RoleUpdate
from src.services.archive import get_base_url
from src.services.auth import role as role_service
from src.services.auth.permissions import Permissions

router = APIRouter()


@router.get(
    "/",
    response_model=List[RoleResponse],
    summary="List all roles",
    description="Returns all roles with their permissions.",
)
def list_roles(
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.USERS_READ])),
) -> List[RoleResponse]:
    base_url = get_base_url(str(request.url), 2)
    return role_service.list_roles(db, base_url)


@router.post(
    "/",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a role",
    description="Create a new role with optional permissions.",
)
def create_role(
    role: RoleCreate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.USERS_CREATE])),
) -> RoleResponse:
    base_url = get_base_url(str(request.url), 2)
    return role_service.create_role(db, role, base_url)


@router.get(
    "/{role_id}",
    response_model=RoleResponse,
    summary="Get a role",
    description="Get a role by its ID.",
)
def get_role(
    role_id: int,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.USERS_READ])),
) -> RoleResponse:
    base_url = get_base_url(str(request.url), 2)
    return role_service.get_role(db, role_id, base_url)


@router.put(
    "/{role_id}",
    response_model=RoleResponse,
    summary="Update a role",
    description="Update a role's name or permissions.",
)
def update_role(
    role_id: int,
    update: RoleUpdate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.USERS_UPDATE])),
) -> RoleResponse:
    base_url = get_base_url(str(request.url), 2)
    return role_service.update_role(db, role_id, update, base_url)


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
