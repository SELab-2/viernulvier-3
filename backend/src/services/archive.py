from sqlalchemy.orm import Session
from src.models import Event, Hall
from src.schemas.event import EventResponse, HallNested, EventCreate, EventUpdate
from fastapi import HTTPException
from typing import Any



def build_event_response(
    db: Session,
    event: Event,
    base_url: str
) -> EventResponse:

    hall = db.query(Hall).filter(Hall.id == event.hall_id).first()

    return EventResponse(
        id=f"{base_url}/events/{event.id}",
        production_id=f"{base_url}/productions/{event.production_id}",
        hall_id=event.hall_id,
        hall=HallNested(
            name=hall.name,
            address=hall.address
        ) if hall else None,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        order_url=event.order_url,
        external_order_url=event.external_order_url,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )


def get_event_by_id(db: Session, event_id: int, base_url: str) -> EventResponse:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise ValueError("Event not found")

    return build_event_response(db, event, base_url)


# DELETE /event, returns succes or not
def delete_event_by_id(db: Session, event_id: int) -> bool:
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        return False

    db.delete(event)
    db.commit()
    return True

def get_hall_by_id(db: Session, hall_id: int) -> Hall:
    return db.query(Hall).filter(Hall.id == hall_id).first()


def make_event(db: Session, event_in: EventCreate, base_url: str) -> EventResponse:
    # case 1: use existing hall
    if event_in.hall_id is not None:
        db_hall = db.query(Hall).filter(Hall.id == event_in.hall_id).first()
        if not db_hall:
            raise ValueError("Hall not found")
    # case 2: create new hall
    else:
        db_hall = Hall(**event_in.hall.model_dump())
        db.add(db_hall)
        db.flush() 


    # create the event
    db_event = Event(
        production_id=event_in.production_id,
        hall_id=db_hall.id,
        starts_at=event_in.starts_at,
        ends_at=event_in.ends_at,
        order_url=event_in.order_url,
        external_order_url=event_in.external_order_url,
    )

    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    return build_event_response(db, db_event, base_url)





def update_event(
    db: Session,
    event_id: int,
    update_data: EventUpdate,
    base_url: str
) -> EventResponse:
    
    # get the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # only get the given fields for the patch
    update_dict: dict[str, Any] = update_data.model_dump(exclude_unset=True)

    # special check for hall_id
    if "hall_id" in update_dict:
        db_hall = db.query(Hall).filter(Hall.id == update_dict["hall_id"]).first()
        if not db_hall:
            raise HTTPException(status_code=404, detail="Hall not found")

    # update the fields
    for field, value in update_dict.items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)

    return build_event_response(db, event, base_url)
