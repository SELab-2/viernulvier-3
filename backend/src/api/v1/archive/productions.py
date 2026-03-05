from sqlalchemy.orm import Session
from backend.src.database import get_db
from backend.src.schemas.production import ProductionListResponse, ProductionResponse, ProductionInfoResponse
from backend.src.services.production import get_production_id_service, get_production_info_id_service, get_productions_service
from fastapi import APIRouter, Depends, Query, Request, HTTPException

router = APIRouter()

# TODO: Add filter options (after merge tags-branch).
# TODO: check for right upper/lower bounds.
@router.get("/productions", response=ProductionListResponse)
async def get_productions(request: Request, db: Session = Depends(get_db), cursor: int | None = Query(None), limit: int = Query(20, ge=1, le=100)) -> ProductionListResponse:
    base_url = str(request.base_url).rstrip("/")
    return get_productions_service(db, base_url, cursor, limit)

@router.get("/productions/{production_id}", response=ProductionResponse)
async def get_production_id(production_id: int, request: Request, db: Session = Depends(get_db)) -> ProductionResponse:
    base_url = str(request.base_url).rstrip("/")
    try:
        production_data = get_production_id_service(db, production_id, base_url)
    except ValueError as e:
        raise HTTPException(status_code=404, details=str(e))
    
    return production_data

@router.get("/productions/{production_id}/infos/{language_id}", response=ProductionInfoResponse)
async def get_production_info_id(production_id: int, language_id: int, request: Request, db: Session = Depends(get_db)) -> ProductionInfoResponse:
    base_url = str(request.base_url).rstrip("/")
    try:
        production_info_data = get_production_info_id_service(db, production_id, language_id, base_url)
    except ValueError as e:
        raise HTTPException(status_code=404, details=str(e))

    return production_info_data
