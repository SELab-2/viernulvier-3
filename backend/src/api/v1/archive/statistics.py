from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.statistics import StatisticsResponse
from src.services.archive import get_base_url
from src.services.statistics import get_statistics

router = APIRouter()


@router.get(
    "/",
    response_model=StatisticsResponse,
    summary="Get archive statistics",
    description="Returns archive counts and all unique tags.",
)
async def statistics(
    request: Request, db: Session = Depends(get_db)
) -> StatisticsResponse:
    base_url = get_base_url(str(request.url), remove_last_segments=1)
    return get_statistics(db, base_url)
