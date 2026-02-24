"""SQLAlchemy-model voor mediagalerijen."""

from sqlalchemy import Column, Integer, Text
from src.database import Base


class Gallery(Base):
    __tablename__ = "gallery"

    id = Column(Integer, primary_key=True)
    media = Column(Text) # dit is momenteel een placeholder en wordt verder uitgewerkt in feature #27
