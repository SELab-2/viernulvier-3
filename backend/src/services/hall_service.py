from sqlalchemy.orm import Session
from typing import List

from src.models import Hall
from src.schemas.hall import HallResponse, HallCreate, HallUpdate
from src.api.exceptions import NotFoundError


def build_hall_response(hall: Hall, base_url: str) -> HallResponse:
    return HallResponse(
        id_url=f"{base_url}/halls/{hall.id}", name=hall.name, address=hall.address
    )


def get_all_halls(db: Session, base_url: str) -> List[HallResponse]:
    halls = db.query(Hall).all()
    return [build_hall_response(hall, base_url) for hall in halls]


def get_hall_by_id(db: Session, hall_id: int, base_url: str) -> HallResponse:
    hall = db.query(Hall).filter(Hall.id == hall_id).first()
    if not hall:
        raise NotFoundError("Hall", hall_id)

    return build_hall_response(hall, base_url)


def create_hall(db: Session, hall_in: HallCreate, base_url: str) -> HallResponse:
    hall = Hall(**hall_in.model_dump())

    db.add(hall)
    db.commit()
    db.refresh(hall)

    return build_hall_response(hall, base_url)


def update_hall(
    db: Session, hall_id: int, hall_in: HallUpdate, base_url: str
) -> HallResponse:
    hall = db.query(Hall).filter(Hall.id == hall_id).first()
    if not hall:
        raise NotFoundError("Hall", hall_id)

    update_data = hall_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(hall, field, value)

    db.commit()
    db.refresh(hall)

    return build_hall_response(hall, base_url)


def delete_hall_by_id(db: Session, hall_id: int) -> None:
    hall = db.query(Hall).filter(Hall.id == hall_id).first()

    if not hall:
        raise NotFoundError("Hall", hall_id)
    db.commit()
