import pytest

from src.services.hall_service import (
    get_all_halls,
    get_hall_by_id,
    create_hall,
    update_hall,
    delete_hall_by_id,
)

from src.schemas.hall import HallSchema
from src.models.hall import Hall


def test_create_hall(db_session):
    hall_in = HallSchema(name="Main Hall", address="Street 1")

    hall = create_hall(db_session, hall_in)

    assert hall.name == "Main Hall"
    assert hall.address == "Street 1"


def test_get_hall_by_id_success(db_session):
    hall = Hall(name="Hall A", address="Street A")

    db_session.add(hall)
    db_session.commit()

    result = get_hall_by_id(db_session, hall.id)

    assert result.name == "Hall A"
    assert result.address == "Street A"


def test_get_hall_by_id_not_found(db_session):
    with pytest.raises(ValueError):
        get_hall_by_id(db_session, 999)


def test_get_all_halls(db_session):
    hall1 = Hall(name="Hall A", address="Street A")
    hall2 = Hall(name="Hall B", address="Street B")

    db_session.add_all([hall1, hall2])
    db_session.commit()

    halls = get_all_halls(db_session)

    assert len(halls) == 2
    assert halls[0].name == "Hall A"
    assert halls[1].name == "Hall B"


def test_update_hall_success(db_session):
    hall = Hall(name="Old Hall", address="Old Street")

    db_session.add(hall)
    db_session.commit()

    update_data = HallSchema(name="New Hall", address="New Street")

    updated = update_hall(db_session, hall.id, update_data)

    assert updated.name == "New Hall"
    assert updated.address == "New Street"


def test_update_hall_not_found(db_session):
    hall_in = HallSchema(name="Doesnt matter", address="Doesnt matter")

    with pytest.raises(ValueError):
        update_hall(db_session, 999, hall_in)


def test_delete_hall_by_id_success(db_session):
    hall = Hall(name="Hall A", address="Street A")

    db_session.add(hall)
    db_session.commit()

    result = delete_hall_by_id(db_session, hall.id)

    assert result is True


def test_delete_hall_by_id_not_found(db_session):
    result = delete_hall_by_id(db_session, 999)

    assert result is False
