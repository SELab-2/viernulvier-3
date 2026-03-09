"""
Database-initialisatie — maakt alle tabellen aan op basis van de SQLAlchemy-modellen.

Dit script wordt automatisch uitgevoerd vóór de start van de API-server
(zie Dockerfile).
"""

import os
from datetime import datetime

from src.database import SESSION_LOCAL, init_db
from src.models.language import Language
from src.models.permission import Permission
from src.models.role import Role
from src.models.sync_state import ResourceType, SyncState, SyncType
from src.models.user import User
from src.services.auth.password import get_password_hash
from src.services.auth.permissions import Permissions
from src.services.language import Languages


def seed_db():
    db = SESSION_LOCAL()
    try:
        all_perms = Permissions.all()
        db_perms = []
        for perm_name in all_perms:
            perm = db.query(Permission).filter(Permission.name == perm_name).first()
            if not perm:
                perm = Permission(name=perm_name)
                db.add(perm)
                db.commit()
                db.refresh(perm)
            db_perms.append(perm)

        all_langs = Languages.all()
        for lang_name in all_langs:
            lang = db.query(Language).filter(Language.language == lang_name).first()
            if not lang:
                lang = Language(language=lang_name)
                db.add(lang)
                db.commit()
                db.refresh(lang)

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

        admin_user = db.query(User).filter(User.username == admin_username).first()
        if not admin_user:
            hashed_password = get_password_hash(admin_password)
            admin_user = User(username=admin_username, hashed_password=hashed_password)
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(
                f"Created default admin user: '{admin_username}' / '{admin_password}'"
            )

        if admin_role not in admin_user.roles:
            admin_user.roles.append(admin_role)
            db.commit()
            print("Successfully assigned the 'admin' role to the default admin user.")

        start_sync_date = datetime.fromisocalendar(2026, 1, 1)
        for sync_type in SyncType:
            for resource_type in ResourceType:
                sync_state = db.query(SyncState).filter(
                    SyncState.sync_type == sync_type
                ).filter(
                    SyncState.resource == resource_type
                ).first()
                if not sync_state:
                    sync_state = SyncState(
                        resource=resource_type,
                        sync_type=sync_type,
                        last_timestamp=start_sync_date
                    )
                    db.add(sync_state)
                    db.commit()
                    db.refresh(sync_state)

    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    seed_db()
