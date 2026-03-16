from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.schemas.hall import HallSchema
from src.services.hall_service import (
    get_all_halls,
    get_hall_by_id,
    create_hall,
    update_hall,
    delete_hall_by_id,
)

from src.services.auth.permissions import Permissions
from src.api.dependencies import RequirePermissions
from src.models.user import User

router = APIRouter()


@router.get("/", response_model=List[HallSchema])
def get_halls(db: Session = Depends(get_db)):
    return get_all_halls(db)


@router.get("/{hall_id}", response_model=HallSchema)
def get_hall(hall_id: int, db: Session = Depends(get_db)):
    return get_hall_by_id(db, hall_id)


@router.post("/", response_model=HallSchema, status_code=201)
def post_hall(
    hall_in: HallSchema,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_CREATE])),
):
    return create_hall(db, hall_in)


@router.patch("/{hall_id}", response_model=HallSchema)
def patch_hall(
    hall_id: int,
    hall_in: HallSchema,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_UPDATE])),
):
    return update_hall(db, hall_id, hall_in)


@router.delete("/{hall_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hall(
    hall_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_DELETE])),
):
    delete_hall_by_id(db, hall_id)
