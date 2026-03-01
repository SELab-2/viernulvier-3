"""SQLAlchemy-modellen voor evenementen en evenementprijzen."""

from sqlalchemy import DECIMAL, TIMESTAMP, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from src.database import Base
from sqlalchemy.sql import func


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    production_id = Column(Integer, ForeignKey("productions.id"))
    hall_id = Column(Integer, ForeignKey("halls.id"))
    starts_at = Column(TIMESTAMP)
    ends_at = Column(TIMESTAMP)
    order_url = Column(String)
    external_order_url = Column(String)
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)

    production = relationship("Production", back_populates="events")
    hall = relationship("Hall", back_populates="events")
    prices = relationship("EventPrice", back_populates="event")


class EventPrice(Base):
    __tablename__ = "event_prices"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    label = Column(String)
    amount = Column(DECIMAL)
    available = Column(Integer)
    expires_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    event = relationship("Event", back_populates="prices")
