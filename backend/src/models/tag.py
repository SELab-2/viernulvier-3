"""SQLAlchemy-model voor tags."""

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from src.database import Base
from src.models.associations import prod_tags


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True)

    names = relationship("TagName", back_populates="tag")
    productions = relationship("Production", secondary=prod_tags, back_populates="tags")


class TagName(Base):
    __tablename__ = "tag_names"
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)
    language_id = Column(Integer, ForeignKey("language.id"), primary_key=True)

    name = Column(String)

    tag = relationship("Tag", back_populates="names")
    language = relationship("Language")
