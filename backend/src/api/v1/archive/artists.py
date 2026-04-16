from typing import List
from src.models.production import ProdInfo
from sqlalchemy.orm import Session
from collections import defaultdict
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from src.database import get_db

router = APIRouter()


class ArtistResponse(BaseModel):
    en: List[str]
    nl: List[str]


@router.get(
        "/",
        response_model=ArtistResponse
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

    return ArtistResponse(
        en=en_artists,
        nl=nl_artists
        )
