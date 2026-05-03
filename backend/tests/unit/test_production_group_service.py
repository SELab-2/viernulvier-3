import pytest

from src.api.exceptions import NotFoundError, ValidationError
from src.models.production_group import ProductionGroup
from src.schemas.production_group import ProductionGroupCreate, ProductionGroupUpdate
from src.services.production_group import (
    create_production_group,
    delete_production_group_by_id,
    get_production_group_by_id,
    get_production_groups_list,
    update_production_group,
)

BASE_URL = "http://test"


def test_get_production_groups_list_public_only(db_session, productions_limited):
    public_group = ProductionGroup(
        title="Public group",
        is_public_filter=True,
        productions=[productions_limited[0]],
    )
    hidden_group = ProductionGroup(
        title="Hidden group",
        is_public_filter=False,
        productions=[productions_limited[1]],
    )
    db_session.add_all([public_group, hidden_group])
    db_session.commit()

    result = get_production_groups_list(db_session, BASE_URL)

    assert len(result) == 1
    assert result[0].title == "Public group"
    assert result[0].is_public_filter is True


def test_get_production_groups_list_include_hidden(db_session, productions_limited):
    db_session.add_all(
        [
            ProductionGroup(title="Public group", productions=[productions_limited[0]]),
            ProductionGroup(
                title="Hidden group",
                is_public_filter=False,
                productions=[productions_limited[1]],
            ),
        ]
    )
    db_session.commit()

    result = get_production_groups_list(db_session, BASE_URL, public_only=False)

    assert {group.title for group in result} == {"Public group", "Hidden group"}


def test_get_production_group_by_id_success(db_session, productions_limited):
    production_group = ProductionGroup(
        title="Season picks",
        productions=productions_limited,
    )
    db_session.add(production_group)
    db_session.commit()

    result = get_production_group_by_id(db_session, production_group.id, BASE_URL)

    assert result.id_url == f"{BASE_URL}/production-groups/{production_group.id}"
    assert result.title == "Season picks"
    assert set(result.production_id_urls) == {
        f"{BASE_URL}/productions/{production.id}" for production in productions_limited
    }


def test_get_production_group_by_id_not_found(db_session):
    with pytest.raises(NotFoundError):
        get_production_group_by_id(db_session, 999, BASE_URL)


def test_create_production_group(db_session, productions_limited):
    production_group_in = ProductionGroupCreate(
        title="Fresh arrivals",
        is_public_filter=False,
        production_id_urls=[
            f"/productions/{productions_limited[0].id}",
            f"/productions/{productions_limited[1].id}",
        ],
    )

    result = create_production_group(db_session, production_group_in, BASE_URL)

    assert result.title == "Fresh arrivals"
    assert result.is_public_filter is False
    assert set(result.production_id_urls) == {
        f"{BASE_URL}/productions/{production.id}" for production in productions_limited
    }


def test_create_production_group_invalid_productions(db_session):
    production_group_in = ProductionGroupCreate(
        title="Broken group",
        production_id_urls=["/productions/123", "/productions/456"],
    )

    with pytest.raises(ValidationError, match="Productions do not exist"):
        create_production_group(db_session, production_group_in, BASE_URL)


def test_update_production_group(db_session, productions_limited):
    production_group = ProductionGroup(
        title="Old title",
        productions=[productions_limited[0]],
    )
    db_session.add(production_group)
    db_session.commit()

    result = update_production_group(
        db_session,
        production_group.id,
        ProductionGroupUpdate(
            title="New title",
            is_public_filter=False,
            production_id_urls=[f"/productions/{productions_limited[1].id}"],
        ),
        BASE_URL,
    )

    assert result.title == "New title"
    assert result.is_public_filter is False
    assert result.production_id_urls == [
        f"{BASE_URL}/productions/{productions_limited[1].id}"
    ]


def test_update_production_group_invalid_productions(db_session):
    production_group = ProductionGroup(title="Existing group")
    db_session.add(production_group)
    db_session.commit()

    with pytest.raises(ValidationError, match="Productions do not exist"):
        update_production_group(
            db_session,
            production_group.id,
            ProductionGroupUpdate(production_id_urls=["/productions/999"]),
            BASE_URL,
        )


def test_delete_production_group_success(db_session):
    production_group = ProductionGroup(title="Disposable group")
    db_session.add(production_group)
    db_session.commit()

    assert delete_production_group_by_id(db_session, production_group.id) is True


def test_delete_production_group_not_found(db_session):
    with pytest.raises(NotFoundError):
        delete_production_group_by_id(db_session, 999)
