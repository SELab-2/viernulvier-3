from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends
from src.database import get_db
from src.schemas.artists import ArtistsResponse
from src.services.artists import get_artists

router = APIRouter()


@router.get(
    "/",
    response_model=ArtistsResponse,
    summary="Get all artists",
    description="Returns lists of the artists, filtered by language",
)
def get_all_artists(db: Session = Depends(get_db)):
    return get_artists(db)
