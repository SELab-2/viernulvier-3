from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.services.event_service import (
    get_event_by_id,
    delete_event_by_id,
    create_event,
    update_event,
    get_prices_for_event,
    get_event_price,
)

from src.schemas.event import EventResponse, EventCreate, EventUpdate, PriceResponse
from src.services.auth.permissions import Permissions
from src.api.dependencies import RequirePermissions
from src.models.user import User
from src.services.archive import get_base_url

router = APIRouter()


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, request: Request, db: Session = Depends(get_db)):
    base_url = get_base_url(request, 2)

    try:
        event_data = get_event_by_id(db, event_id, base_url)
    except ValueError:
        raise HTTPException(status_code=404, detail="Event not found")

    return event_data


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_DELETE])),
):
    success = delete_event_by_id(db, event_id)

    if not success:
        raise HTTPException(status_code=404, detail="Event not found")


@router.post("/", response_model=EventResponse, status_code=201)
def post_event(
    event_in: EventCreate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_CREATE])),
):
    base_url = get_base_url(request)

    try:
        return create_event(db, event_in, base_url)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{event_id}", response_model=EventResponse)
def patch_event(
    event_id: int,
    update_data: EventUpdate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_UPDATE])),
):
    base_url = get_base_url(request, 2)
    
    try:
        return update_event(db, event_id, update_data, base_url)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{event_id}/prices", response_model=list[PriceResponse])
def get_event_prices(event_id: int, request: Request, db: Session = Depends(get_db)):
    base_url = get_base_url(request, 3)

    try:
        return get_prices_for_event(db, event_id, base_url)
    except ValueError:
        raise HTTPException(status_code=404, detail="Event not found")


@router.get("/{event_id}/prices/{price_id}", response_model=PriceResponse)
def get_price(
    event_id: int, price_id: int, request: Request, db: Session = Depends(get_db)
):
    base_url = get_base_url(request, 4)

    try:
        return get_event_price(db, event_id, price_id, base_url)
    except ValueError:
        raise HTTPException(status_code=404, detail="Price not found")
