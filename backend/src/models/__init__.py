"""
SQLAlchemy-modellen — importeer alle modellen zodat Base.metadata volledig is.
"""

from src.database import Base
from src.models.associations import (
    prod_tags,
    prod_groups,
    prod_blogs,
    role_permissions,
    user_roles,
)
from src.models.blogs import Blog, BlogContent
from src.models.event import Event, EventPrice
from src.models.hall import Hall
from src.models.history import History
from src.models.permission import Permission
from src.models.production_group import ProductionGroup
from src.models.production import ProdInfo, Production
from src.models.role import Role
from src.models.tag import Tag, TagName
from src.models.user import User
from src.models.media import Media
import src.models.listeners.production_dates as production_dates

__all__ = [
    "Base",
    "prod_tags",
    "prod_groups",
    "prod_blogs",
    "user_roles",
    "role_permissions",
    "Production",
    "ProdInfo",
    "ProductionGroup",
    "Tag",
    "TagName",
    "Hall",
    "History",
    "Event",
    "EventPrice",
    "User",
    "Role",
    "Permission",
    "Media",
    "Blog",
    "BlogContent",
    "production_dates",
]
