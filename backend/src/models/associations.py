"""Koppeltabellen (many-to-many) tussen producties en tags, producties en blogs
users en rollen, rollen en permissies"""

from sqlalchemy import Column, ForeignKey, Integer, Table
from src.database import Base

prod_tags = Table(
    "prod_tags",
    Base.metadata,
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
    Column("prod_id", Integer, ForeignKey("productions.id"), primary_key=True),
)

prod_blogs = Table(
    "prod_blogs",
    Base.metadata,
    Column("blog_id", Integer, ForeignKey("blogs.id"), primary_key=True),
    Column("prod_id", Integer, ForeignKey("productions.id"), primary_key=True),
)

user_roles = Table(
    "user_roles",
    Base.metadata,
    Column(
        "user_id",
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "role_id",
        Integer,
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column(
        "role_id",
        Integer,
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "permission_id",
        Integer,
        ForeignKey("permissions.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
