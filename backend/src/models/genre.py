"""SQLAlchemy-model voor genres."""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from src.database import Base
from src.models.associations import prod_genres


class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True)
    name = Column(String)

    productions = relationship(
        "Production", secondary=prod_genres, back_populates="genres"
    )
