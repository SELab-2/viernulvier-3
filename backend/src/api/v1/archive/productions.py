from sqlalchemy.orm import Session
from src.database import get_db
from src.schemas.production import ProductionCreate, ProductionInfoCreate, ProductionListResponse, ProductionResponse, ProductionUpdate
from src.services.production import create_production, get_production_by_id, get_productions_paginated, update_production_by_id, delete_production_by_id
from fastapi import APIRouter, Depends, Query, Request, HTTPException, status
from src.services.auth.permissions import Permissions
from src.api.dependencies import RequirePermissions
from src.models.user import User

router = APIRouter()

# TODO: Add filter options (after merge tags-branch).
# TODO: check for right upper/lower bounds.
@router.get("/", response_model=ProductionListResponse)
async def get_productions(request: Request, db: Session = Depends(get_db), cursor: int | None = Query(None), limit: int = Query(20, ge=1, le=100)) -> ProductionListResponse:
    base_url = str(request.base_url).rstrip("/")
    try:
        productions_data = get_productions_paginated(db, base_url, cursor, limit)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    return productions_data

@router.post("/", response_model=ProductionResponse)
async def post_production(production_in: ProductionCreate, production_info_in: ProductionInfoCreate,
                           language_id: int, request: Request, db: Session = Depends(get_db), _: User = Depends(RequirePermissions(Permissions.ARCHIVE_CREATE))) -> ProductionResponse:
    base_url = str(request.base_url).rstrip("/")
    try:
        production_data = create_production(db, production_in, production_info_in, language_id, base_url)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    return production_data
    
@router.get("/{production_id}", response_model=ProductionResponse)
async def get_production(production_id: int, request: Request, db: Session = Depends(get_db)) -> ProductionResponse:
    base_url = str(request.base_url).rstrip("/")
    try:
        production_data = get_production_by_id(db, production_id, base_url)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    return production_data

@router.patch("/{production_id}", response_model=ProductionResponse)
async def patch_production(production_id: int, production_in: ProductionUpdate, request: Request, 
                           db: Session = Depends(get_db), _: User = Depends(RequirePermissions(Permissions.ARCHIVE_UPDATE))) -> ProductionResponse:
    base_url = str(request.base_url).rstrip("/")
    try:
        production_data = update_production_by_id(db, production_in, production_id, base_url)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return production_data

@router.delete("/{production_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_production(production_id: int, db: Session = Depends(get_db), 
                            _: User = Depends(RequirePermissions(Permissions.ARCHIVE_DELETE))):
    try:
        delete_production_by_id(db, production_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
