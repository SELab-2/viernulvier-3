from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, Text
from src.database import Base


class Visual(Base):
    __tablename__ = "visuals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    object_key = Column(Text, nullable=False, unique=True)
    content_type = Column(Text, nullable=False)
    title = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    visual_type = Column(Text, nullable=True)
    uploaded_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
