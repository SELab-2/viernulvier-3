from typing import List

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from src.api.dependencies import RequirePermissions
from src.database import get_db
from src.models.user import User
from src.schemas.hall import HallCreate, HallResponse, HallUpdate
from src.services.archive import get_base_url
from src.services.auth.permissions import Permissions
from src.services.hall_service import (
    create_hall,
    delete_hall_by_id,
    get_all_halls,
    get_hall_by_id,
    update_hall,
)

router = APIRouter()


@router.get("/", response_model=List[HallResponse])
def get_halls(request: Request, db: Session = Depends(get_db)):
    base_url = get_base_url(str(request.url))
    return get_all_halls(db, base_url)


@router.get("/{hall_id}", response_model=HallResponse)
def get_hall(hall_id: int, request: Request, db: Session = Depends(get_db)):
    base_url = get_base_url(str(request.url))
    return get_hall_by_id(db, hall_id, base_url)


@router.post("/", response_model=HallCreate, status_code=201)
def post_hall(
    hall_in: HallCreate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_CREATE])),
):
    base_url = get_base_url(str(request.url))
    return create_hall(db, hall_in, base_url)


@router.patch("/{hall_id}", response_model=HallUpdate)
def patch_hall(
    hall_id: int,
    hall_in: HallUpdate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_UPDATE])),
):
    base_url = get_base_url(str(request.url))
    return update_hall(db, hall_id, hall_in, base_url)


@router.delete("/{hall_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hall(
    hall_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_DELETE])),
):
    delete_hall_by_id(db, hall_id)
