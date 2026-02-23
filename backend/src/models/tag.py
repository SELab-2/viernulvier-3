"""SQLAlchemy-model voor tags."""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from src.database import Base
from src.models.associations import prod_tags


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True)
    name = Column(String)

    productions = relationship("Production", secondary=prod_tags, back_populates="tags")
