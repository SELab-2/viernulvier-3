"""SQLAlchemy model voor mediabestanden gekoppeld aan producties."""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from src.database import Base


class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True)
    production_id = Column(
        Integer, ForeignKey("productions.id"), nullable=False, index=True
    )
    object_key = Column(Text, nullable=False, unique=True)
    content_type = Column(Text, nullable=False)
    uploaded_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    production = relationship("Production", back_populates="media")
