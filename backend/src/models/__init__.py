"""
SQLAlchemy-modellen — importeer alle modellen zodat Base.metadata volledig is.
"""

from src.database import Base
from src.models.associations import (
    prod_genres,
    prod_tags,
    role_permissions,
    user_roles,
)
from src.models.event import Event, EventPrice
from src.models.gallery import Gallery
from src.models.genre import Genre, GenreName
from src.models.hall import Hall
from src.models.permission import Permission
from src.models.production import ProdInfo, Production
from src.models.role import Role
from src.models.tag import Tag, TagName
from src.models.user import User

__all__ = [
    "Base",
    "prod_tags",
    "prod_genres",
    "user_roles",
    "role_permissions",
    "Gallery",
    "Production",
    "ProdInfo",
    "Genre",
    "GenreName",
    "Tag",
    "TagName",
    "Hall",
    "Event",
    "EventPrice",
    "User",
    "Role",
    "Permission",
]
