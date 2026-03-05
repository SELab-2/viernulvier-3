import pytest
from src.models.role import Role
from src.models.permission import Permission
from src.schemas.auth import RoleCreate, RoleUpdate
from src.services.auth import role as role_service


def test_create_role_duplicate_name(db_session):
    db_session.add(Role(name="duprole"))
    db_session.commit()
    with pytest.raises(Exception):
        role_service.create_role(db_session, RoleCreate(name="duprole", permissions=[]))


def test_create_role_invalid_permission(db_session):
    with pytest.raises(Exception):
        role_service.create_role(
            db_session, RoleCreate(name="role", permissions=["invalid:perm"])
        )


def test_update_role_duplicate_name(db_session):
    r1 = Role(name="r1")
    r2 = Role(name="r2")
    db_session.add(r1)
    db_session.add(r2)
    db_session.commit()
    with pytest.raises(Exception):
        role_service.update_role(
            db_session, r2.id, RoleUpdate(name="r1", permissions=[])
        )


def test_update_role_invalid_permission(db_session):
    r = Role(name="r")
    db_session.add(r)
    db_session.commit()
    with pytest.raises(Exception):
        role_service.update_role(
            db_session, r.id, RoleUpdate(name="r", permissions=["invalid:perm"])
        )


def test_delete_role_not_found(db_session):
    with pytest.raises(Exception):
        role_service.delete_role(db_session, 999)
