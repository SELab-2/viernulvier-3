"""
SQLAlchemy-modellen — importeer alle modellen zodat Base.metadata volledig is.
"""

from src.database import Base
from src.models.associations import prod_genres, prod_tags
from src.models.event import Event, EventPrice
from src.models.gallery import Gallery
from src.models.genre import Genre
from src.models.hall import Hall
from src.models.language import Language
from src.models.production import ProdInfo, Production
from src.models.tag import Tag

__all__ = [
    "Base",
    "prod_tags",
    "prod_genres",
    "Language",
    "Gallery",
    "Production",
    "ProdInfo",
    "Genre",
    "Tag",
    "Hall",
    "Event",
    "EventPrice",
]
