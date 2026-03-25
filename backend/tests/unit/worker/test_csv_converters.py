from datetime import datetime
from src.worker.converters.production import csv_prod_to_model_prod
from src.worker.converters.event import csv_event_to_model_event
from src.services.language import Languages


# Test normal test case with fake data
def test_csv_prod_to_model_prod():
    test_input = [
        "test title",
        "test supertitle",
        "test description1",
        "test description2",
        "test genre",
        "1234",
        "5678",
    ]

    prod = csv_prod_to_model_prod(test_input)
    prod_infos = prod.info

    # Check prod
    assert prod.viernulvier_id == 1234
    assert prod.performer_type is None
    assert prod.attendance_mode is None

    # Check that fields that are set by our DB are not set
    assert prod.id is None
    assert prod.created_at is None
    assert prod.updated_at is None

    # Check prod_infos

    # Only 1 info for nl
    assert len(prod_infos) == 1
    assert prod_infos[0].language == Languages.NEDERLANDS

    # Extract the info's to more easily test them
    info_nl = prod_infos[0]

    # Production_id should point to our DB productions, but those are not set
    # by the converters
    assert info_nl.production_id is None

    assert info_nl.title == test_input[0]
    assert info_nl.supertitle == test_input[1]
    assert info_nl.artist is None
    assert info_nl.tagline is None
    assert info_nl.teaser is None
    assert info_nl.description == test_input[2] + "\n" + test_input[3]
    assert info_nl.info is None


# Test normal test case from the actual csv
def test_csv_event_to_model_event():
    test_input = ["2006-07-01 22:00:00", "2006-07-01 06:00:00", "Concertzaal", "5833"]

    event = csv_event_to_model_event(1, test_input, 0)

    assert event.production_id == 1
    assert event.starts_at == datetime.fromisoformat(test_input[0])
    assert event.ends_at == datetime.fromisoformat(test_input[1])
    assert event.hall_id == 0

    assert event.id is None
    assert event.viernulvier_id is None
    assert event.created_at is None
    assert event.updated_at is None


# Test incorrect dates for model
def test_csv_event_incorrect_dates():
    test_input = ["0000-00-00 00:00:00", "0000-00-00 06:00:00", "Concertzaal", "5833"]

    event = csv_event_to_model_event(1, test_input, 0)

    assert event.starts_at == datetime.fromisoformat("1970-01-01 00:00:00")
    assert event.ends_at == datetime.fromisoformat("1970-01-01 00:00:00")
