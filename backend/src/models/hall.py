"""SQLAlchemy-model voor zalen (venues)."""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from src.database import Base


class Hall(Base):
    __tablename__ = "halls"

    id = Column(Integer, primary_key=True)
    address = Column(String)
    name = Column(String)

    events = relationship("Event", back_populates="hall")
    

