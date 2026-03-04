from http.client import HTTPException

from flask import Request
from requests import Session

from backend.src.database import get_db
from backend.src.schemas.production import ProductionResponse, ProductionInfoResponse
from backend.src.services.production import get_production_by_id, get_production_info_by_id
from fastapi import APIRouter, Depends

router = APIRouter()

@router.get("/{production_id}", response=ProductionResponse)
async def get_event(production_id: int, request: Request, db: Session = Depends(get_db)) -> ProductionResponse:
    base_url = str(request.base_url).rstrip("/")
    try:
        production_data = get_production_by_id(db, production_id, base_url)
    except ValueError as e:
        raise HTTPException(status_code=404, details=str(e))
    
    return production_data

@router.get("/{production_id}/infos/{language_id}", response=ProductionInfoResponse)
async def get_production_info(production_id: int, language_id: int, request: Request, db: Session = Depends(get_db)) -> ProductionInfoResponse:
    base_url = str(request.base_url).rstrip("/")
    try:
        production_info_data = get_production_info_by_id(db, production_id, language_id, base_url)
    except ValueError as e:
        raise HTTPException(status_code=404, details=str(e))

    return production_info_data
