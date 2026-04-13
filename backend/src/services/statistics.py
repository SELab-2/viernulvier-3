from sqlalchemy import distinct, func
from sqlalchemy.orm import Session

from src.models import Event, ProdInfo, Production
from src.schemas.statistics import StatisticsResponse
from src.services.tag import get_tags_list


def get_statistics(db: Session, base_url: str) -> StatisticsResponse:
    productions_count = db.query(func.count(Production.id)).scalar() or 0
    events_count = db.query(func.count(Event.id)).scalar() or 0

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
        tags=get_tags_list(db, base_url),
    )
