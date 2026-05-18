"""SQLAlchemy-modellen voor producties en productie-informatie (vertalingen)."""

from sqlalchemy import TIMESTAMP, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base
from src.models.associations import prod_groups, prod_tags


class Production(Base):
    __tablename__ = "productions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    viernulvier_id = Column(Integer, unique=True, autoincrement=False)

    performer_type = Column(String)
    attendance_mode = Column(String)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(
        TIMESTAMP, server_default=func.now(), server_onupdate=func.now()
    )
    earliest_at = Column(TIMESTAMP)
    latest_at = Column(TIMESTAMP)

    info = relationship(
        "ProdInfo",
        back_populates="production",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    tags = relationship(
        "Tag",
        secondary=prod_tags,
        back_populates="productions",
        passive_deletes=True,
    )
    groups = relationship(
        "ProductionGroup",
        secondary=prod_groups,
        back_populates="productions",
        passive_deletes=True,
    )
    events = relationship(
        "Event",
        back_populates="production",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    media = relationship(
        "Media",
        back_populates="production",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class ProdInfo(Base):
    __tablename__ = "prod_info"

    production_id = Column(
        Integer, ForeignKey("productions.id", ondelete="CASCADE"), primary_key=True
    )
    language = Column(String, primary_key=True)
    title = Column(String)
    supertitle = Column(String)
    artist = Column(String)
    tagline = Column(String)
    teaser = Column(String)
    description = Column(String)
    info = Column(String)

    production = relationship("Production", back_populates="info")
