from enum import StrEnum
from typing import List

from sqlalchemy import asc, desc
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.api.exceptions import NotFoundError, ValidationError
from src.models.history import History
from src.schemas.history import HistoryCreate, HistoryResponse, HistoryUpdate


class ORDER(StrEnum):
    ASCENDING = "Ascending"
    DESCENDING = "Descending"


def build_history_response(history: History, base_url: str) -> HistoryResponse:
    return HistoryResponse(
        id_url=f"{base_url}/history/{history.year}/{history.language}",
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
    sort_order: ORDER = ORDER.DESCENDING,
) -> List[HistoryResponse]:
    order_func = asc if sort_order == ORDER.ASCENDING else desc

    query = db.query(History)

    if year is not None:
        query = query.filter(History.year == year)
    if language:
        query = query.filter(History.language == language)

    entries = query.order_by(
        order_func(History.year), order_func(History.language)
    ).all()
    return [build_history_response(entry, base_url) for entry in entries]


def get_history_entry(
    db: Session, year: int, language: str, base_url: str
) -> HistoryResponse:
    entry = (
        db.query(History)
        .filter(History.year == year, History.language == language)
        .first()
    )
    if not entry:
        raise NotFoundError("History", f"{year}/{language}")

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
    year: int,
    language: str,
    history_in: HistoryUpdate,
    base_url: str,
) -> HistoryResponse:
    entry = (
        db.query(History)
        .filter(History.year == year, History.language == language)
        .first()
    )
    if not entry:
        raise NotFoundError("History", f"{year}/{language}")

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


def delete_history_entry(db: Session, year: int, language: str) -> None:
    entry = (
        db.query(History)
        .filter(History.year == year, History.language == language)
        .first()
    )
    if not entry:
        raise NotFoundError("History", f"{year}/{language}")

    db.delete(entry)
    db.commit()
