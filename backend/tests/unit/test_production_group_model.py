from sqlalchemy import inspect

from src.models.production import Production
from src.models.production_group import ProductionGroup


def test_production_group_tables_are_registered(db_session):
    table_names = inspect(db_session.bind).get_table_names()

    assert "production_groups" in table_names
    assert "prod_groups" in table_names


def test_production_group_relationship_and_defaults(db_session):
    production = Production()
    group = ProductionGroup(title="Spring picks", productions=[production])

    db_session.add(group)
    db_session.commit()
    db_session.refresh(group)
    db_session.refresh(production)

    assert group.id is not None
    assert group.is_public_filter is True
    assert [linked_production.id for linked_production in group.productions] == [
        production.id
    ]
    assert [linked_group.id for linked_group in production.groups] == [group.id]


def test_production_group_can_be_hidden_from_public_filters(db_session):
    group = ProductionGroup(title="Internal shortlist", is_public_filter=False)

    db_session.add(group)
    db_session.commit()
    db_session.refresh(group)

    assert group.is_public_filter is False
