from sqlalchemy.orm import Session
from typing import List
from fastapi import HTTPException, status
from src.models.role import Role
from src.models.permission import Permission
from src.schemas.auth import RoleCreate, RoleUpdate, RoleResponse
from src.services.auth.permissions import Permissions


def list_roles(db: Session) -> List[RoleResponse]:
    roles = db.query(Role).all()
    return [
        RoleResponse(id=r.id, name=r.name, permissions=[p.name for p in r.permissions])
        for r in roles
    ]


def create_role(db: Session, role: RoleCreate) -> RoleResponse:
    if db.query(Role).filter(Role.name == role.name).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Role name already exists"
        )
    db_role = Role(name=role.name)
    if role.permissions:
        unique_permissions = list(set(role.permissions))
        valid_permissions = set(Permissions.all())
        invalid = [p for p in unique_permissions if p not in valid_permissions]
        if invalid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid permissions: {', '.join(invalid)}",
            )
        perms = db.query(Permission).filter(Permission.name.in_(unique_permissions)).all()
        if len(perms) != len(unique_permissions):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more permissions do not exist in the database",
            )
        db_role.permissions = perms
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return RoleResponse(
        id=db_role.id,
        name=db_role.name,
        permissions=[p.name for p in db_role.permissions],
    )


def get_role(db: Session, role_id: int) -> RoleResponse:
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )
    return RoleResponse(
        id=role.id, name=role.name, permissions=[p.name for p in role.permissions]
    )


def update_role(db: Session, role_id: int, update: RoleUpdate) -> RoleResponse:
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )
    if (
        update.name != role.name
        and db.query(Role).filter(Role.name == update.name, Role.id != role_id).first()
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Role name already exists"
        )
    role.name = update.name
    if update.permissions is not None:
        unique_permissions = list(set(update.permissions))
        valid_permissions = set(Permissions.all())
        invalid = [p for p in unique_permissions if p not in valid_permissions]
        if invalid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid permissions: {', '.join(invalid)}",
            )
        perms = (
            db.query(Permission).filter(Permission.name.in_(unique_permissions)).all()
        )
        if len(perms) != len(unique_permissions):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more permissions do not exist in the database",
            )
        role.permissions = perms
    db.commit()
    db.refresh(role)
    return RoleResponse(
        id=role.id, name=role.name, permissions=[p.name for p in role.permissions]
    )


def delete_role(db: Session, role_id: int) -> None:
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )
    db.delete(role)
    db.commit()
