from typing import List

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from src.api.dependencies import RequirePermissions
from src.api.dependencies.language import get_accepted_language
from src.database import get_db
from src.models.user import User
from src.schemas.history import HistoryCreate, HistoryResponse, HistoryUpdate
from src.services.archive import get_base_url
from src.services.auth.permissions import Permissions
from src.services.history import (
    create_history,
    delete_history_by_id,
    get_all_history_entries,
    get_history_by_id,
    update_history,
)

router = APIRouter()


@router.get("/", response_model=List[HistoryResponse])
def get_history(
    request: Request,
    db: Session = Depends(get_db),
    year: int | None = None,
    language: str | None = Depends(get_accepted_language),
):
    base_url = get_base_url(str(request.url))
    return get_all_history_entries(db, base_url, year=year, language=language)


@router.get("/{history_id}", response_model=HistoryResponse)
def get_history_entry(
    history_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    base_url = get_base_url(str(request.url), remove_last_segments=2)
    return get_history_by_id(db, history_id, base_url)


@router.post("/", response_model=HistoryResponse, status_code=status.HTTP_201_CREATED)
def post_history(
    history_in: HistoryCreate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_CREATE])),
):
    base_url = get_base_url(str(request.url))
    return create_history(db, history_in, base_url)


@router.patch("/{history_id}", response_model=HistoryResponse)
def patch_history(
    history_id: int,
    history_in: HistoryUpdate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_UPDATE])),
):
    base_url = get_base_url(str(request.url), remove_last_segments=2)
    return update_history(db, history_id, history_in, base_url)


@router.delete("/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_history(
    history_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_DELETE])),
):
    delete_history_by_id(db, history_id)
