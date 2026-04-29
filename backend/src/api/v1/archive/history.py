from typing import List

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from src.api.dependencies import RequirePermissions
from src.api.dependencies.language import get_accepted_language
from src.database import get_db
from src.models.user import User
from src.schemas.history import HistoryCreate, HistoryResponse, HistoryUpdate
from src.services.archive import get_base_url
from src.services.auth.permissions import Permissions
from src.services.history import (
    ORDER,
    create_history,
    delete_history_entry,
    get_all_history_entries,
    get_history_entry as get_history_entry_by_key,
    update_history,
)

router = APIRouter()


@router.get("/", response_model=List[HistoryResponse])
def get_history(
    request: Request,
    db: Session = Depends(get_db),
    year: int | None = None,
    language: str | None = Depends(get_accepted_language),
    sort_order: ORDER = Query(ORDER.DESCENDING),
):
    base_url = get_base_url(str(request.url))
    return get_all_history_entries(
        db, base_url, year=year, language=language, sort_order=sort_order
    )


@router.get("/{year}/{language}", response_model=HistoryResponse)
def get_history_entry(
    year: int,
    language: str,
    request: Request,
    db: Session = Depends(get_db),
):
    base_url = get_base_url(str(request.url), remove_last_segments=3)
    return get_history_entry_by_key(db, year, language, base_url)


@router.post("/", response_model=HistoryResponse, status_code=status.HTTP_201_CREATED)
def post_history(
    history_in: HistoryCreate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_CREATE])),
):
    base_url = get_base_url(str(request.url))
    return create_history(db, history_in, base_url)


@router.patch("/{year}/{language}", response_model=HistoryResponse)
def patch_history(
    year: int,
    language: str,
    history_in: HistoryUpdate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_UPDATE])),
):
    base_url = get_base_url(str(request.url), remove_last_segments=3)
    return update_history(db, year, language, history_in, base_url)


@router.delete("/{year}/{language}", status_code=status.HTTP_204_NO_CONTENT)
def delete_history(
    year: int,
    language: str,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_DELETE])),
):
    delete_history_entry(db, year, language)
