from sqlalchemy.orm import Session
from src.api.dependencies.language import get_accepted_language
from src.database import get_db
from src.schemas.production import (
    ProductionCreate,
    ProductionListResponse,
    ProductionResponse,
    ProductionUpdate,
)
from src.services.production import (
    create_production,
    get_production_by_id,
    get_productions_paginated,
    update_production_by_id,
    delete_production_by_id,
)
from fastapi import APIRouter, Depends, Query, Request, HTTPException, status
from src.services.auth.permissions import Permissions
from src.api.dependencies import RequirePermissions
from src.models.user import User
from src.services.archive import get_base_url

router = APIRouter()


# TODO: Add filter options (after merge tags-branch).
@router.get(
    "/",
    response_model=ProductionListResponse,
    summary="Get productions",
    description="Gets all productions of the database, using pagination.",
)
async def get_productions(
    request: Request,
    db: Session = Depends(get_db),
    cursor: int | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
) -> ProductionListResponse:
    base_url = get_base_url(str(request.url))
    return get_productions_paginated(db, base_url, cursor, limit)


@router.post(
    "/",
    response_model=ProductionResponse,
    status_code=201,
    summary="Create production",
    description="Create a new production in the database.",
)
async def post_production(
    production_in: ProductionCreate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_CREATE])),
) -> ProductionResponse:
    base_url = get_base_url(str(request.url))
    try:
        production_data = create_production(db, production_in, base_url)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return production_data


@router.get(
    "/{production_id}",
    response_model=ProductionResponse,
    summary="Get production by id",
    description="Gets a production with a certain id.",
)
async def get_production(
    production_id: int,
    request: Request,
    db: Session = Depends(get_db),
    language: str | None = Depends(get_accepted_language),
) -> ProductionResponse:
    base_url = get_base_url(str(request.url), 2)
    try:
        production_data = get_production_by_id(db, production_id, base_url, language)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return production_data


@router.patch(
    "/{production_id}",
    response_model=ProductionResponse,
    summary="Update production by id",
    description="Update a production with a certain id.",
)
async def patch_production(
    production_id: int,
    production_in: ProductionUpdate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_UPDATE])),
) -> ProductionResponse:
    base_url = get_base_url(str(request.url), 2)
    try:
        production_data = update_production_by_id(
            db, production_in, production_id, base_url
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return production_data


@router.delete(
    "/{production_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete production by id",
    description="Deletes a production with a certain id.",
)
async def delete_production(
    production_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_DELETE])),
):
    try:
        delete_production_by_id(db, production_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
