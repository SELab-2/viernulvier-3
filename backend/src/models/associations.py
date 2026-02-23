"""Koppeltabellen (many-to-many) tussen producties, tags en genres."""

from sqlalchemy import Column, ForeignKey, Integer, Table
from src.database import Base

prod_tags = Table(
    "prod_tags",
    Base.metadata,
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
    Column("prod_id", Integer, ForeignKey("productions.id"), primary_key=True),
)

prod_genres = Table(
    "prod_genres",
    Base.metadata,
    Column("genre_id", Integer, ForeignKey("genres.id"), primary_key=True),
    Column("prod_id", Integer, ForeignKey("productions.id"), primary_key=True),
)
