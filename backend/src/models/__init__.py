"""
SQLAlchemy-modellen — importeer alle modellen zodat Base.metadata volledig is.
"""

from src.database import Base
from src.models.associations import prod_genres, prod_tags, user_roles, role_permissions
from src.models.event import Event, EventPrice
from src.models.gallery import Gallery
from src.models.genre import Genre, GenreName
from src.models.hall import Hall
from src.models.language import Language
from src.models.production import ProdInfo, Production
from src.models.tag import Tag, TagName
from src.models.user import User
from src.models.role import Role
from src.models.permission import Permission

__all__ = [
    "Base",
    "prod_tags",
    "prod_genres",
    "user_roles",
    "role_permissions",
    "Language",
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
