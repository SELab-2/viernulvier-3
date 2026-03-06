from sqlalchemy.orm import Session
from typing import List

from src.models import Hall
from src.schemas.hall import HallSchema

def get_all_halls(db: Session) -> List[HallSchema]:
    halls = db.query(Hall).all()
    return [HallSchema(name=h.name, address=h.address) for h in halls]


def get_hall_by_id(db: Session, hall_id: int) -> HallSchema:
    hall = db.query(Hall).filter(Hall.id == hall_id).first()
    if not hall:
        raise ValueError("Hall not found")

    return HallSchema(name=hall.name, address=hall.address)


def create_hall(db: Session, hall_in: HallSchema) -> HallSchema:
    hall = Hall(**hall_in.model_dump())
    db.add(hall)
    db.commit()
    db.refresh(hall)

    return HallSchema(name=hall.name, address=hall.address)


def update_hall(db: Session, hall_id: int, hall_in: HallSchema) -> HallSchema:
    hall = db.query(Hall).filter(Hall.id == hall_id).first()
    if not hall:
        raise ValueError("Hall not found")

    update_data = hall_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(hall, field, value)

    db.commit()
    db.refresh(hall)

    return HallSchema(name=hall.name, address=hall.address)


def delete_hall_by_id(db: Session, hall_id: int) -> bool:
    hall = db.query(Hall).filter(Hall.id == hall_id).first()
    if not hall:
        return False

    db.delete(hall)
    db.commit()
    return True