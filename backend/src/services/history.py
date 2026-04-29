from typing import List

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.api.exceptions import NotFoundError, ValidationError
from src.models.history import History
from src.schemas.history import HistoryCreate, HistoryResponse, HistoryUpdate


def build_history_response(history: History, base_url: str) -> HistoryResponse:
    return HistoryResponse(
        id_url=f"{base_url}/history/{history.id}",
        year=history.year,
        language=history.language,
        title=history.title,
        content=history.content,
    )


def get_all_history_entries(
    db: Session,
    base_url: str,
    year: int | None = None,
    language: str | None = None,
) -> List[HistoryResponse]:
    query = db.query(History)

    if year is not None:
        query = query.filter(History.year == year)
    if language:
        query = query.filter(History.language == language)

    entries = query.order_by(History.year.desc()).all()
    return [build_history_response(entry, base_url) for entry in entries]


def get_history_by_id(db: Session, history_id: int, base_url: str) -> HistoryResponse:
    entry = db.query(History).filter(History.id == history_id).first()
    if not entry:
        raise NotFoundError("History", history_id)

    return build_history_response(entry, base_url)




def create_history(
    db: Session, history_in: HistoryCreate, base_url: str
) -> HistoryResponse:
    

    entry = History(**history_in.model_dump())
    db.add(entry)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValidationError(
            f"History entry for year {history_in.year} and language '{history_in.language}' already exists"
        )
    db.refresh(entry)

    return build_history_response(entry, base_url)


def update_history(
    db: Session,
    history_id: int,
    history_in: HistoryUpdate,
    base_url: str,
) -> HistoryResponse:
    entry = db.query(History).filter(History.id == history_id).first()
    if not entry:
        raise NotFoundError("History", history_id)

    update_data = history_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(entry, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValidationError(
            f"History entry for year {history_in.year} and language '{history_in.language}' already exists"
        )
        
    db.refresh(entry)

    return build_history_response(entry, base_url)


def delete_history_by_id(db: Session, history_id: int) -> None:
    entry = db.query(History).filter(History.id == history_id).first()
    if not entry:
        raise NotFoundError("History", history_id)

    db.delete(entry)
    db.commit()
