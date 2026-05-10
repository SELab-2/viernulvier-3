from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, Text
from src.database import Base


class Print(Base):
    __tablename__ = "prints"

    id = Column(Integer, primary_key=True, autoincrement=True)
    object_key = Column(Text, nullable=False, unique=True)
    content_type = Column(Text, nullable=False)
    label = Column(Text, nullable=True)
    print_type = Column(Text, nullable=True)
    uploaded_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
