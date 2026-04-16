from src.models.production import ProdInfo
from sqlalchemy.orm import Session
from collections import defaultdict
from fastapi import APIRouter, Depends
from src.database import get_db
from src.schemas.artists import ArtistsResponse

router = APIRouter()


@router.get(
    "/",
    response_model=ArtistsResponse,
    summary="Get all artists",
    description="Returns lists of the artists, filtered by language",
)
def get_all_artists(db: Session = Depends(get_db)):
    rows = (
        db.query(ProdInfo)
        .with_entities(ProdInfo.production_id, ProdInfo.language, ProdInfo.artist)
        .all()
    )

    productions: dict[int, dict[str, str]] = defaultdict(dict)
    for production_id, language, artist in rows:
        productions[production_id][language] = artist

    en_artists = set()
    nl_artists = set()

    for production_id, lang_map in productions.items():
        en_artist = lang_map.get("en")
        nl_artist = lang_map.get("nl")

        # Fall back to the other language if one is missing
        resolved_en = en_artist or nl_artist
        resolved_nl = nl_artist or en_artist

        if resolved_en:
            en_artists.add(resolved_en)
        if resolved_nl:
            nl_artists.add(resolved_nl)

    return ArtistsResponse(en=en_artists, nl=nl_artists)
