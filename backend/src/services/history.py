from typing import List

from sqlalchemy.orm import Session

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


def _ensure_unique_year_language(
    db: Session,
    year: int,
    language: str,
    current_id: int | None = None,
) -> None:
    query = db.query(History).filter(History.year == year, History.language == language)
    if current_id is not None:
        query = query.filter(History.id != current_id)

    existing = query.first()
    if existing:
        raise ValidationError(
            f"History entry for year {year} and language '{language}' already exists"
        )


def create_history(
    db: Session, history_in: HistoryCreate, base_url: str
) -> HistoryResponse:
    _ensure_unique_year_language(db, history_in.year, history_in.language)

    entry = History(**history_in.model_dump())
    db.add(entry)
    db.commit()
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

    new_year = update_data.get("year", entry.year)
    new_language = update_data.get("language", entry.language)
    _ensure_unique_year_language(db, new_year, new_language, current_id=entry.id)

    for field, value in update_data.items():
        setattr(entry, field, value)

    db.commit()
    db.refresh(entry)

    return build_history_response(entry, base_url)


def delete_history_by_id(db: Session, history_id: int) -> None:
    entry = db.query(History).filter(History.id == history_id).first()
    if not entry:
        raise NotFoundError("History", history_id)

    db.delete(entry)
    db.commit()
