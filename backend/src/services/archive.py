from sqlalchemy.orm import Session
from models import Event, Hall
from schemas.event import EventResponse, HallNested, EventCreate, EventUpdate



def build_event_response(
    db: Session,
    event: Event,
    base_url: str
) -> EventResponse:
    hall = db.query(Hall).filter(Hall.id == event.hall_id).first()

    event_data = EventResponse.model_validate(event)
    event_data.id = f"{base_url}/events/{event.id}"
    event_data.production_id = f"{base_url}/productions/{event.production_id}"

    if hall:
        event_data.hall_id = hall.id
        event_data.hall = HallNested(
            name=hall.name,
            address=hall.address
        )

    return event_data


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



def update_event(db: Session, event_id: int, update_data: EventUpdate, base_url: str) -> EventResponse:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise ValueError("Event not found")

    # hall id update
    if update_data.hall_id is not None:
        db_hall = db.query(Hall).filter(Hall.id == update_data.hall_id).first()
        if not db_hall:
            raise ValueError("Hall not found")
        event.hall_id = db_hall.id

    # update other fields if given
    if update_data.production_id is not None:
        event.production_id = update_data.production_id
    if update_data.starts_at is not None:
        event.starts_at = update_data.starts_at
    if update_data.ends_at is not None:
        event.ends_at = update_data.ends_at
    if update_data.order_url is not None:
        event.order_url = update_data.order_url
    if update_data.external_order_url is not None:
        event.external_order_url = update_data.external_order_url
    
    db.commit()
    db.refresh(event)
    
    return build_event_response(db, event, base_url)
