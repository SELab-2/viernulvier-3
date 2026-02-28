from sqlalchemy.orm import Session
from models import Event, Hall

# /event
def get_event_by_id(db: Session, event_id: int) -> Event:
    return db.query(Event).filter(Event.id == event_id).first()

def get_hall_by_id(db: Session, hall_id: int) -> Hall:
    return db.query(Hall).filter(Hall.id == hall_id).first()
