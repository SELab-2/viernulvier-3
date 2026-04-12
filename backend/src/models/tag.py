"""SQLAlchemy-model voor tags."""

from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from src.database import Base
from src.models.associations import prod_tags


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    viernulvier_id = Column(Integer, unique=False, autoincrement=False)
    viernulvier_use = Column(String, nullable=True)

    names = relationship("TagName", back_populates="tag")
    productions = relationship("Production", secondary=prod_tags, back_populates="tags")

    __table_args__ = (
            UniqueConstraint("viernulvier_id", "viernulvier_use", name="unique_viernulvier_entry"),
            )


class TagName(Base):
    __tablename__ = "tag_names"
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)
    language = Column(String, primary_key=True)

    name = Column(String)

    tag = relationship("Tag", back_populates="names")
