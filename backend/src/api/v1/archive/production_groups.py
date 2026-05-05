from typing import List

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from src.api.dependencies import RequirePermissions
from src.database import get_db
from src.models.user import User
from src.schemas.production_group import (
    ProductionGroupCreate,
    ProductionGroupResponse,
    ProductionGroupUpdate,
)
from src.services.archive import get_base_url
from src.services.auth.permissions import Permissions
from src.services.production_group import (
    create_production_group,
    delete_production_group_by_id,
    get_production_group_by_id,
    get_production_groups_list,
    update_production_group,
)

router = APIRouter()


@router.get(
    "/",
    response_model=List[ProductionGroupResponse],
    summary="Get production groups",
    description="Returns production groups, optionally including hidden groups.",
)
async def get_production_groups(
    request: Request,
    db: Session = Depends(get_db),
    public_only: bool = Query(True),
):
    base_url = get_base_url(str(request.url))
    return get_production_groups_list(db, base_url, public_only=public_only)


@router.get(
    "/{production_group_id}",
    response_model=ProductionGroupResponse,
    summary="Get a production group",
)
async def get_production_group(
    production_group_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    base_url = get_base_url(str(request.url), remove_last_segments=2)
    return get_production_group_by_id(db, production_group_id, base_url)


@router.post(
    "/",
    response_model=ProductionGroupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a production group",
)
async def post_production_group(
    production_group_in: ProductionGroupCreate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_CREATE])),
):
    base_url = get_base_url(str(request.url))
    return create_production_group(db, production_group_in, base_url)


@router.patch(
    "/{production_group_id}",
    response_model=ProductionGroupResponse,
    summary="Update a production group",
)
async def patch_production_group(
    production_group_id: int,
    production_group_in: ProductionGroupUpdate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_UPDATE])),
):
    base_url = get_base_url(str(request.url), remove_last_segments=2)
    return update_production_group(
        db, production_group_id, production_group_in, base_url
    )


@router.delete(
    "/{production_group_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a production group",
)
async def delete_production_group(
    production_group_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_DELETE])),
):
    delete_production_group_by_id(db, production_group_id)
