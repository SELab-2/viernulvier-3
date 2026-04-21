from src.models.production import ProdInfo
from collections import defaultdict
from sqlalchemy.orm import Session
from src.schemas.artists import ArtistsResponse


def get_artists(db: Session):
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
