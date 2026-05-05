"""SQLAlchemy-model voor zalen (venues)."""

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from src.database import Base


class Hall(Base):
    __tablename__ = "halls"

    id = Column(Integer, primary_key=True, autoincrement=True)
    viernulvier_id = Column(Integer, unique=True, autoincrement=False)

    address = Column(String, nullable=True)

    names = relationship("HallName", back_populates="hall")
    events = relationship("Event", back_populates="hall")


class HallName(Base):
    __tablename__ = "hallnames"

    hall_id = Column(Integer, ForeignKey("halls.id"), primary_key=True)
    language = Column(String, primary_key=True)
    name = Column(String)

    hall = relationship("Hall", back_populates="names")
