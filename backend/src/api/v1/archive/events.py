from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from src.database import get_db
from services.archive import get_event_by_id, delete_event_by_id, make_event, update_event
from schemas.event import EventResponse, EventCreate, EventUpdate, HallNested
from services.auth.permissions import Permissions
from dependencies import RequirePermissions
from models.user import User

router = APIRouter()

@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, request: Request, db: Session = Depends(get_db)):
    base_url = str(request.base_url).rstrip("/")
    try:
        event_data = get_event_by_id(db, event_id, base_url)
    except ValueError:
        raise HTTPException(status_code=404, detail="Event not found")

    return event_data


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, request: Request, db: Session = Depends(get_db), _: User = Depends(RequirePermissions([Permissions.ARCHIVE_DELETE]))):
    succes = delete_event_by_id(db, event_id)
    if not succes:
        raise HTTPException(status_code=404, detail="Event not found")
    
    
    
@router.post("/", response_model=EventResponse, status_code=201)
def post_event(event_in: EventCreate, db: Session = Depends(get_db), _: User = Depends(RequirePermissions([Permissions.ARCHIVE_CREATE])), request: Request = None):
    base_url = str(request.base_url).rstrip("/")
    try:
        return make_event(db, event_in, base_url)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{event_id}", response_model=EventResponse)
def patch_event(event_id: int, update_data: EventUpdate, request: Request, db: Session = Depends(get_db), _: User = Depends(RequirePermissions([Permissions.ARCHIVE_UPDATE]))):
    base_url = str(request.base_url).rstrip("/")

    try:
        return update_event(db, event_id, update_data, base_url)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    
    