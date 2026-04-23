from sqlalchemy import distinct, func
from sqlalchemy.orm import Session

from src.models import Event, ProdInfo, Production, Tag
from src.schemas.statistics import StatisticsResponse


def get_statistics(db: Session, base_url: str) -> StatisticsResponse:
    productions_count = db.query(func.count(Production.id)).scalar() or 0
    events_count = db.query(func.count(Event.id)).scalar() or 0
    tags_count = db.query(func.count(Tag.id)).scalar() or 0

    unique_artists_count = (
        db.query(func.count(distinct(ProdInfo.artist)))
        .filter(ProdInfo.artist.isnot(None), ProdInfo.artist != "")
        .scalar()
        or 0
    )

    return StatisticsResponse(
        productions_count=productions_count,
        events_count=events_count,
        unique_artists_count=unique_artists_count,
        tags_count=tags_count,
    )
