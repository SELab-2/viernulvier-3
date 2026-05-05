from typing import List

from sqlalchemy.orm import Session
from src.api.exceptions import NotFoundError
from src.models import Hall, HallName
from src.schemas.hall import HallCreate, HallResponse, HallUpdate


def build_hall_response(hall: Hall, base_url: str) -> HallResponse:
    return HallResponse(
        id_url=f"{base_url}/halls/{hall.id}", names=hall.names, address=hall.address
    )


def get_all_halls(db: Session, base_url: str) -> List[HallResponse]:
    halls = db.query(Hall).all()
    return [build_hall_response(hall, base_url) for hall in halls]


def get_hall_by_id(db: Session, hall_id: int, base_url: str) -> HallResponse:
    hall = db.query(Hall).filter(Hall.id == hall_id).first()
    if not hall:
        raise NotFoundError("Hall", hall_id)

    return build_hall_response(hall, base_url)


def create_hall(
    db_session: Session, hall_in: HallCreate, base_url: str
) -> HallResponse:
    hall = Hall(address=hall_in.address)

    hall.names = [
        HallName(language=name.language, name=name.name) for name in hall_in.names
    ]

    db_session.add(hall)
    db_session.commit()
    db_session.refresh(hall)

    return build_hall_response(hall, base_url)


def update_hall(
    db: Session, hall_id: int, hall_in: HallUpdate, base_url: str
) -> HallResponse:
    hall: Hall = db.query(Hall).filter(Hall.id == hall_id).first()
    if not hall:
        raise NotFoundError("Hall", hall_id)

    update_data = hall_in.model_dump(exclude_unset=True)

    if "address" in update_data:
        hall.address = update_data["address"]

    # Get a list of names that already exist (these will need to be adjusted instead of added)
    # Note that these are by reference still linked to the original hall,
    # so changing them will also change the hall object like we want
    if "names" in update_data:
        existing_names = {name.language: name for name in hall.names}
        for name in update_data["names"]:
            if name["language"] in existing_names:
                existing_names[name["language"]].name = name["name"]
            else:
                hall.names.append(
                    HallName(
                        language=name["language"],
                        name=name["name"],
                    )
                )

    db.commit()
    db.refresh(hall)

    return build_hall_response(hall, base_url)


def delete_hall_by_id(db: Session, hall_id: int) -> None:
    hall = db.query(Hall).filter(Hall.id == hall_id).first()

    if not hall:
        raise NotFoundError("Hall", hall_id)

    for hallname in hall.names:
        db.delete(hallname)

    db.delete(hall)
    db.commit()
