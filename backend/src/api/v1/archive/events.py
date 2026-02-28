from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from src.database import get_db
from services.archive import get_event_by_id, get_hall_by_id
from schemas.event import EventResponse, HallNested
from models import Event, Hall
router = APIRouter()

@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, request: Request, db: Session = Depends(get_db)):
    event: Event = get_event_by_id(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    hall: Hall = get_hall_by_id(db, event.hall_id)

    # change integer id's to full urls
    base_url = str(request.base_url).rstrip("/")

    event_data: EventResponse = EventResponse.model_validate(event)
    event_data.id = f"{base_url}/events/{event.id}"
    event_data.production_id = f"{base_url}/productions/{event.production_id}"
    
    # give nested hall object 
    event_data.hall = HallNested(name=hall.name, adress=hall.address)

    return event_data