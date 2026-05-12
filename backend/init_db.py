"""
Database initialization — creates all tables based on the SQLAlchemy models.
This script is automatically executed before the API server starts
(see Dockerfile).
"""

import logging
import os
from collections import defaultdict
from datetime import datetime

from src.database import SESSION_LOCAL, init_db
from src.models.permission import Permission
from src.models.role import Role
from src.models.sync_state import ResourceType, SyncState, SyncType
from src.models.user import User
from src.seed_history import seed_history_if_empty
from src.services.auth.password import get_password_hash
from src.services.auth.permissions import Permissions

logger = logging.getLogger(__name__)


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
            admin_user = User(
                username=admin_username,
                hashed_password=hashed_password,
                super_user=True,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            logger.info("Created default admin user: '%s'", admin_username)

        if not admin_user.super_user:
            admin_user.super_user = True
            db.commit()
            db.refresh(admin_user)
            logger.info("Promoted the default admin user to protected super user.")

        if admin_role not in admin_user.roles:
            admin_user.roles.append(admin_role)
            db.commit()
            logger.info(
                "Successfully assigned the 'admin' role to the default admin user."
            )

        start_sync_date = defaultdict(lambda: datetime.fromisocalendar(2026, 14, 1))
        start_sync_date[ResourceType.HALLS] = datetime.fromisocalendar(2000, 1, 1)
        start_sync_date[ResourceType.GENRES] = datetime.fromisocalendar(2000, 1, 1)

        for sync_type in SyncType:
            for resource_type in ResourceType:
                sync_state = (
                    db.query(SyncState)
                    .filter(SyncState.sync_type == sync_type)
                    .filter(SyncState.resource == resource_type)
                    .first()
                )
                if not sync_state:
                    sync_state = SyncState(
                        resource=resource_type,
                        sync_type=sync_type,
                        last_timestamp=start_sync_date[resource_type],
                    )
                    db.add(sync_state)
                    db.commit()
                    db.refresh(sync_state)

        seed_history_if_empty(db)

    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    seed_db()
