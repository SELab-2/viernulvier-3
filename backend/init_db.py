"""
Database-initialisatie — maakt alle tabellen aan op basis van de SQLAlchemy-modellen.

Dit script wordt automatisch uitgevoerd vóór de start van de API-server (zie Dockerfile).
"""

import os

from src.database import SessionLocal, init_db
from src.models.permission import Permission
from src.models.role import Role
from src.models.user import User
from src.services.auth.password import get_password_hash
from src.services.auth.permissions import Permissions


def seed_db():
    db = SessionLocal()
    try:
        all_perms = Permissions.all()
        db_perms = []
        for perm_name in all_perms:
            perm = (
                db.query(Permission)
                .filter(Permission.name == perm_name)
                .first()
            )
            if not perm:
                perm = Permission(name=perm_name)
                db.add(perm)
                db.commit()
                db.refresh(perm)
            db_perms.append(perm)

        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(name="admin")
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)

        admin_role.permissions = db_perms
        db.commit()

        admin_username = os.getenv("DEFAULT_ADMIN_USER", "admin")
        admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin")

        admin_user = (
            db.query(User).filter(User.username == admin_username).first()
        )
        if not admin_user:
            hashed_password = get_password_hash(admin_password)
            admin_user = User(
                username=admin_username, hashed_password=hashed_password
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(
                f"Created default admin user: '{admin_username}' / '{admin_password}'"
            )

        if admin_role not in admin_user.roles:
            admin_user.roles.append(admin_role)
            db.commit()
            print(
                "Successfully assigned the 'admin' role to the default admin user."
            )

    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    seed_db()
