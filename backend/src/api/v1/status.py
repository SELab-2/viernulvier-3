from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.api.dependencies import get_db
from src.schemas.status import HealthResponse
from src.services.status import get_health

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Returns the health of the API and its database connection.",
)
def health_check(db: Session = Depends(get_db)) -> HealthResponse:
    return get_health(db)
