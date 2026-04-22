import pytest
from fastapi import HTTPException

from src.models.permission import Permission
from src.models.role import Role
from src.models.user import User
from src.schemas.auth import UserCreate, UserPatch, UserReplace
from src.services.auth.permissions import Permissions
from src.services.auth import user as user_service
from src.services.auth.password import verify_password


def create_role(db_session, name: str, permissions: list[str] | None = None) -> Role:
    role = Role(name=name)
    db_session.add(role)
    db_session.flush()

    if permissions:
        resolved_permissions = []
        for permission_name in permissions:
            permission = (
                db_session.query(Permission)
                .filter(Permission.name == permission_name)
                .first()
            )
            if not permission:
                permission = Permission(name=permission_name)
                db_session.add(permission)
                db_session.flush()
            resolved_permissions.append(permission)
        role.permissions = resolved_permissions

    db_session.commit()
    db_session.refresh(role)
    return role


def test_create_user_hashes_password_and_assigns_roles(db_session):
    create_role(db_session, "admin", ["users:read"])

    created = user_service.create_user(
        db_session,
        UserCreate(username="alice", password="secret", roles=["admin"]),
        base_url="",
    )

    db_user = user_service.get_user(db_session, "alice")
    assert created.id == db_user.id
    assert created.username == "alice"
    assert created.roles == ["admin"]
    assert created.permissions == ["users:read"]
    assert db_user is not None
    assert db_user.hashed_password != "secret"
    assert verify_password("secret", db_user.hashed_password)


def test_create_user_duplicate_username(db_session):
    db_session.add(User(username="alice", hashed_password="hashed"))
    db_session.commit()

    with pytest.raises(HTTPException) as excinfo:
        user_service.create_user(
            db_session,
            UserCreate(username="alice", password="secret", roles=[]),
            base_url="",
        )

    assert excinfo.value.status_code == 409


def test_create_user_invalid_role(db_session):
    with pytest.raises(HTTPException) as excinfo:
        user_service.create_user(
            db_session,
            UserCreate(username="alice", password="secret", roles=["missing"]),
            base_url="",
        )

    assert excinfo.value.status_code == 400


def test_replace_user_can_change_username_password_and_roles(db_session):
    create_role(db_session, "viewer", ["users:read"])
    create_role(db_session, "editor", ["users:update"])
    created = user_service.create_user(
        db_session,
        UserCreate(username="alice", password="secret", roles=["viewer"]),
        base_url="",
    )

    updated = user_service.replace_user(
        db_session,
        created.id,
        UserReplace(username="alice-updated", password="new-secret", roles=["editor"]),
        base_url="",
    )

    db_user = user_service.get_user(db_session, "alice-updated")
    assert updated.username == "alice-updated"
    assert updated.roles == ["editor"]
    assert updated.permissions == ["users:update"]
    assert db_user is not None
    assert verify_password("new-secret", db_user.hashed_password)
    assert db_user.token_version == 1


def test_patch_user_updates_only_provided_fields(db_session):
    create_role(db_session, "viewer", ["users:read"])
    create_role(db_session, "editor", ["users:update"])
    created = user_service.create_user(
        db_session,
        UserCreate(username="alice", password="secret", roles=["viewer"]),
        base_url="",
    )

    updated = user_service.patch_user(
        db_session,
        created.id,
        UserPatch(username="alice-renamed", roles=["editor"]),
        base_url="",
    )

    db_user = user_service.get_user(db_session, "alice-renamed")
    assert updated.username == "alice-renamed"
    assert updated.roles == ["editor"]
    assert updated.permissions == ["users:update"]
    assert db_user is not None
    assert verify_password("secret", db_user.hashed_password)
    assert db_user.token_version == 0


def test_patch_user_duplicate_username(db_session):
    db_session.add(User(username="alice", hashed_password="hashed"))
    db_session.add(User(username="bob", hashed_password="hashed"))
    db_session.commit()
    bob = user_service.get_user(db_session, "bob")

    with pytest.raises(HTTPException) as excinfo:
        user_service.patch_user(
            db_session, bob.id, UserPatch(username="alice"), base_url=""
        )

    assert excinfo.value.status_code == 409


def test_patch_user_invalid_role(db_session):
    created = user_service.create_user(
        db_session,
        UserCreate(username="alice", password="secret", roles=[]),
        base_url="",
    )

    with pytest.raises(HTTPException) as excinfo:
        user_service.patch_user(
            db_session, created.id, UserPatch(roles=["missing"]), base_url=""
        )

    assert excinfo.value.status_code == 400


def test_get_user_profile_deduplicates_permissions(db_session):
    admin = create_role(db_session, "admin", ["users:read", "users:update"])
    manager = create_role(db_session, "manager", ["users:read"])
    user = User(username="alice", hashed_password="hashed", roles=[admin, manager])
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    profile = user_service.get_user_profile(user, base_url="")

    assert profile.roles == ["admin", "manager"]
    assert profile.permissions == ["users:read", "users:update"]


def test_get_user_profile_returns_all_permissions_for_super_user(db_session):
    user = User(username="root", hashed_password="hashed", super_user=True)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    profile = user_service.get_user_profile(user, base_url="")

    assert profile.super_user is True
    assert profile.permissions == sorted(Permissions.all())


def test_delete_user_not_found(db_session):
    acting_user = User(username="admin", hashed_password="hashed")
    db_session.add(acting_user)
    db_session.commit()
    db_session.refresh(acting_user)

    with pytest.raises(HTTPException) as excinfo:
        user_service.delete_user(db_session, 999, acting_user)

    assert excinfo.value.status_code == 404


def test_delete_user_rejects_deleting_super_user(db_session):
    acting_user = User(username="admin", hashed_password="hashed")
    target = User(username="root", hashed_password="hashed", super_user=True)
    db_session.add_all([acting_user, target])
    db_session.commit()
    db_session.refresh(acting_user)
    db_session.refresh(target)

    with pytest.raises(HTTPException) as excinfo:
        user_service.delete_user(db_session, target.id, acting_user)

    assert excinfo.value.status_code == 403
    assert excinfo.value.detail == "Super users cannot be deleted"


def test_delete_user_rejects_self_delete(db_session):
    acting_user = User(username="admin", hashed_password="hashed")
    db_session.add(acting_user)
    db_session.commit()
    db_session.refresh(acting_user)

    with pytest.raises(HTTPException) as excinfo:
        user_service.delete_user(db_session, acting_user.id, acting_user)

    assert excinfo.value.status_code == 403
    assert excinfo.value.detail == "You cannot delete your own account"
