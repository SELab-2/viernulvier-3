import pytest
from src.api.exceptions import NotFoundError
from src.models.hall import Hall
from src.schemas.hall import HallCreate, HallUpdate
from src.services.hall_service import (
    create_hall,
    delete_hall_by_id,
    get_all_halls,
    get_hall_by_id,
    update_hall,
)


def test_create_hall(db_session):
    hall_in = HallCreate(name="Main Hall", address="Street 1")

    hall = create_hall(db_session, hall_in, "BASE")

    assert hall.name == "Main Hall"
    assert hall.address == "Street 1"
    assert hall.id_url.startswith("BASE/halls/")


def test_get_hall_by_id_success(db_session):
    hall = Hall(name="Hall A", address="Street A")

    db_session.add(hall)
    db_session.commit()

    result = get_hall_by_id(db_session, hall.id, "BASE")

    assert result.name == "Hall A"
    assert result.address == "Street A"
    assert result.id_url.startswith("BASE/halls/")


def test_get_hall_by_id_not_found(db_session):
    with pytest.raises(NotFoundError):
        get_hall_by_id(db_session, 999, "")


def test_get_all_halls(db_session):
    hall1 = Hall(name="Hall A", address="Street A")
    hall2 = Hall(name="Hall B", address="Street B")

    db_session.add_all([hall1, hall2])
    db_session.commit()

    halls = get_all_halls(db_session, "BASE")

    assert len(halls) == 2
    assert halls[0].name == "Hall A"
    assert halls[1].name == "Hall B"
    assert all(hall.id_url.startswith("BASE/halls/") for hall in halls)


def test_update_hall_success(db_session):
    hall = Hall(name="Old Hall", address="Old Street")

    db_session.add(hall)
    db_session.commit()

    update_data = HallUpdate(name="New Hall", address="New Street")

    updated = update_hall(db_session, hall.id, update_data, "BASE")

    assert updated.name == "New Hall"
    assert updated.address == "New Street"
    assert updated.id_url.startswith("BASE/halls/")


def test_update_hall_not_found(db_session):
    hall_in = HallUpdate(name="Doesnt matter", address="Doesnt matter")

    with pytest.raises(NotFoundError):
        update_hall(db_session, 999, hall_in, "")


def test_delete_hall_by_id_success(db_session):
    hall = Hall(name="Hall A", address="Street A")

    db_session.add(hall)
    db_session.commit()
    delete_hall_by_id(db_session, hall.id)


def test_delete_hall_by_id_not_found(db_session):
    with pytest.raises(NotFoundError):
        delete_hall_by_id(db_session, 999)
