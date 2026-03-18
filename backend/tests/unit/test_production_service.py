from src.services.production import (
    get_production_by_id,
    get_productions_paginated,
    get_events_for_production,
    create_production,
    update_production_by_id,
    delete_production_by_id,
)
from src.schemas.production import (
    ProductionCreate,
    ProductionInfoCreate,
    ProductionUpdate,
    ProductionInfoUpdate,
)

from src.api.exceptions import NotFoundError, ValidationError

import pytest

BASE_URL = "http://test"


# Limited amount of productions: only one page.
def test_get_productions_paginated_limited(db_session, productions_limited):
    result = get_productions_paginated(db_session, BASE_URL)
    assert len(result.productions) == 2
    assert (
        result.productions[0].id_url
        == f"{BASE_URL}/productions/{productions_limited[0].id}"
    )
    assert len(result.productions[0].production_infos) == 2
    assert (
        result.productions[1].id_url
        == f"{BASE_URL}/productions/{productions_limited[1].id}"
    )
    assert len(result.productions[1].production_infos) == 1


# More productions than limit: multiple pages.
def test_get_productions_paginated(db_session, many_productions):
    result = get_productions_paginated(db_session, BASE_URL, limit=5)
    assert len(result.productions) == 5
    assert result.pagination.has_more
    assert result.pagination.next_cursor is not None

    for i in range(5):
        assert (
            result.productions[i].id_url
            == f"{BASE_URL}/productions/{many_productions[i].id}"
        )
        assert len(result.productions[i].production_infos) == 2

    next_cursor = result.pagination.next_cursor
    result = get_productions_paginated(
        db_session, BASE_URL, cursor=next_cursor, limit=5
    )
    assert len(result.productions) == 5
    assert not result.pagination.has_more
    assert result.pagination.next_cursor is None

    for i in range(5, 10):
        assert (
            result.productions[i - 5].id_url
            == f"{BASE_URL}/productions/{many_productions[i].id}"
        )
        assert len(result.productions[i - 5].production_infos) == 2


# Get events for production: check if correct event urls are returned.
def test_get_events_for_production(db_session, productions_limited):
    events_prod1 = get_events_for_production(
        db_session, productions_limited[0].id, BASE_URL
    )
    assert len(events_prod1) == 2
    for i in range(2):
        assert (
            events_prod1[i]
            == f"{BASE_URL}/events/{productions_limited[0].events[i].id}"
        )

    events_prod2 = get_events_for_production(
        db_session, productions_limited[1].id, BASE_URL
    )
    assert len(events_prod2) == 4
    for i in range(4):
        assert (
            events_prod2[i]
            == f"{BASE_URL}/events/{productions_limited[1].events[i].id}"
        )


# Get production by id (no/invalid language specified): check if correct production is returned with all correct info and events.
# Invalid language results in all infos, could be changed if desired.
def test_get_production_by_id_no_language(db_session, productions_limited):
    production_response = get_production_by_id(
        db_session, productions_limited[0].id, BASE_URL
    )
    assert (
        production_response.id_url
        == f"{BASE_URL}/productions/{productions_limited[0].id}"
    )
    assert production_response.performer_type == productions_limited[0].performer_type
    assert production_response.attendance_mode == productions_limited[0].attendance_mode
    assert len(production_response.production_infos) == 2
    assert production_response.events == [
        f"{BASE_URL}/events/{event.id}" for event in productions_limited[0].events
    ]


# Get production by id for a specific (valid) language.
def test_get_production_by_id_valid_language(db_session, productions_limited):
    production_response = get_production_by_id(
        db_session, productions_limited[0].id, BASE_URL, language="en"
    )
    assert (
        production_response.id_url
        == f"{BASE_URL}/productions/{productions_limited[0].id}"
    )
    assert production_response.performer_type == productions_limited[0].performer_type
    assert production_response.attendance_mode == productions_limited[0].attendance_mode
    assert len(production_response.production_infos) == 1
    assert production_response.production_infos[0].language == "en"
    assert production_response.events == [
        f"{BASE_URL}/events/{event.id}" for event in productions_limited[0].events
    ]


# Create a valid new production and check if it is added to database.
def test_create_production_valid_info(db_session, productions_limited):
    result = get_productions_paginated(db_session, BASE_URL)
    assert len(result.productions) == 2
    new_prod = ProductionCreate(
        performer_type="band",
        attendance_mode="offline",
        production_info=ProductionInfoCreate(language="nl", title="nieuw_prod_nl"),
    )

    _ = create_production(db_session, new_prod, BASE_URL)
    result2 = get_productions_paginated(db_session, BASE_URL)
    assert len(result2.productions) == 3


# Create an invalid production, results in NotFoundError.
def test_create_production_invalid_info(db_session, productions_limited):
    new_prod = ProductionCreate(
        performer_type="band",
        attendance_mode="offline",
        production_info=ProductionInfoCreate(language="es", title="el production - es"),
    )
    with pytest.raises(ValidationError, match="Language 'es' not supported"):
        _ = create_production(db_session, new_prod, BASE_URL)


# Update an existing production - basic field.
def test_update_production_basic(db_session, productions_limited):
    production_response = get_production_by_id(
        db_session, productions_limited[0].id, BASE_URL
    )
    assert production_response.performer_type == "theater"
    production_update = ProductionUpdate(performer_type="band")
    result = update_production_by_id(
        db_session, production_update, productions_limited[0].id, BASE_URL
    )
    assert result.performer_type == "band"


# Update an existing production - production info field.
def test_update_production_info(db_session, productions_limited):
    # get original production info
    production_response = get_production_by_id(
        db_session, productions_limited[0].id, BASE_URL
    )
    production_info_nl = next(
        info
        for info in production_response.production_infos
        if info.title == "prod1_nl"
    )
    assert production_info_nl.title == "prod1_nl"

    # update production info
    update = ProductionUpdate(
        production_infos=[ProductionInfoUpdate(language="nl", title="updated_title")]
    )
    update_response = update_production_by_id(
        db_session, update, productions_limited[0].id, BASE_URL
    )

    # Check updated in response.
    updated_info = next(
        info
        for info in update_response.production_infos
        if info.title == "updated_title"
    )
    assert updated_info.title == "updated_title"

    # Check updated in database
    production_response = get_production_by_id(
        db_session, productions_limited[0].id, BASE_URL
    )
    production_info_nl = next(
        info
        for info in production_response.production_infos
        if info.title == "updated_title"
    )
    assert production_info_nl.title == "updated_title"


# Update an existing production - add invalid production info.
def test_update_production_info_add_invalid(db_session, productions_limited):
    production_response = get_production_by_id(
        db_session, productions_limited[0].id, BASE_URL
    )
    assert len(production_response.production_infos) == 2

    # New info should not be added (french not supported).
    update = ProductionUpdate(
        production_infos=[
            ProductionInfoUpdate(language="fr", title="Une brioche et deux macarons!")
        ]
    )

    with pytest.raises(ValidationError, match="Language 'fr' not supported"):
        update_production_by_id(db_session, update, productions_limited[0].id, BASE_URL)

    # Check database
    production_response = get_production_by_id(
        db_session, productions_limited[0].id, BASE_URL
    )
    assert len(production_response.production_infos) == 2


# Update an existing production - delete existing production info.
def test_update_production_info_delete(db_session, productions_limited):
    production_response = get_production_by_id(
        db_session, productions_limited[0].id, BASE_URL
    )
    assert len(production_response.production_infos) == 2

    # New info should be deleted.
    update = ProductionUpdate(remove_languages=["en"])

    # Check updated in response.
    update_response = update_production_by_id(
        db_session, update, productions_limited[0].id, BASE_URL
    )
    assert len(update_response.production_infos) == 1

    # Check updated in database
    production_response = get_production_by_id(
        db_session, productions_limited[0].id, BASE_URL
    )
    assert len(production_response.production_infos) == 1


# Update an existing production - delete not existing production info (nothing happens, also no error).
def test_update_production_info_delete_invalid(db_session, productions_limited):
    production_response = get_production_by_id(
        db_session, productions_limited[0].id, BASE_URL
    )
    assert len(production_response.production_infos) == 2

    # New info should not be deleted (invalid language).
    update = ProductionUpdate(remove_languages=["es"])

    # Check response.
    update_response = update_production_by_id(
        db_session, update, productions_limited[0].id, BASE_URL
    )
    assert len(update_response.production_infos) == 2

    # Check database
    production_response = get_production_by_id(
        db_session, productions_limited[0].id, BASE_URL
    )
    assert len(production_response.production_infos) == 2


# Delete an existing production.
def test_delete_production(db_session, productions_limited):
    result = get_productions_paginated(db_session, BASE_URL)
    assert len(result.productions) == 2

    success = delete_production_by_id(db_session, productions_limited[0].id)
    assert success

    result = get_productions_paginated(db_session, BASE_URL)
    assert len(result.productions) == 1
    assert result.productions[0].performer_type == "concert"


# Delete a not existing production (does nothing).
def test_delete_production_invalid(db_session, productions_limited):
    result = get_productions_paginated(db_session, BASE_URL)
    assert len(result.productions) == 2

    # Give a non-existing production id.
    with pytest.raises(NotFoundError):
        delete_production_by_id(db_session, 4)

    result = get_productions_paginated(db_session, BASE_URL)
    assert len(result.productions) == 2
    assert result.productions[0].performer_type == "theater"
