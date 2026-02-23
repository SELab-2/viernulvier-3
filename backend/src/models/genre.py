"""SQLAlchemy-model voor genres."""

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base
from src.models.associations import prod_genres


class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True)
    names = relationship("GenreName", back_populates="genre")

    productions = relationship(
        "Production", secondary=prod_genres, back_populates="genres"
    )

class GenreName(Base):
    __tablename__ = "genre_names"
    genre_id = Column(Integer, ForeignKey("genres.id"), primary_key=True)
    language_id = Column(Integer, ForeignKey("language.id"), primary_key=True)

    name = Column(String)

    genre = relationship("Genre", back_populates="names")
    language = relationship("Language")

