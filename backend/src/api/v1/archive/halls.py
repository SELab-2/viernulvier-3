from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.schemas.hall import HallSchema
from src.services.hall_service import (
    get_all_halls,
    get_hall_by_id,
    create_hall,
    update_hall,
    delete_hall
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
    try:
        return get_hall_by_id(db, hall_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Hall not found")


@router.post("/", response_model=HallSchema, status_code=201)
def post_hall(hall_in: HallSchema, db: Session = Depends(get_db), _: User = Depends(RequirePermissions([Permissions.ARCHIVE_CREATE]))):
    return create_hall(db, hall_in)


@router.patch("/{hall_id}", response_model=HallSchema)
def patch_hall(hall_id: int, hall_in: HallSchema, db: Session = Depends(get_db), _: User = Depends(RequirePermissions([Permissions.ARCHIVE_UPDATE]))):
    try:
        return update_hall(db, hall_id, hall_in)
    except ValueError:
        raise HTTPException(status_code=404, detail="Hall not found")


@router.delete("/{hall_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hall_endpoint(hall_id: int, db: Session = Depends(get_db), _: User = Depends(RequirePermissions([Permissions.ARCHIVE_DELETE]))):
    success = delete_hall(db, hall_id)

    if not success:
        raise HTTPException(status_code=404, detail="Hall not found")