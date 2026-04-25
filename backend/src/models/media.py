"""SQLAlchemy model voor mediabestanden gekoppeld aan producties."""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text, CheckConstraint
from sqlalchemy.orm import relationship
from src.database import Base


class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True)
    production_id = Column(Integer, ForeignKey("productions.id"), index=True)
    object_key = Column(Text, nullable=False, unique=True)
    content_type = Column(Text, nullable=False)
    uploaded_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    production = relationship("Production", back_populates="media")

    blog_id = Column(Integer, ForeignKey("blogs.id"), index=True)
    blog = relationship("Blog", back_populates="media")

    # Either a production or media should exist for this image
    __table_args__ = (
        CheckConstraint(
            "(production_id IS NOT NULL) OR (blog_id IS NOT NULL)",
            name="ck_media_production_or_blog",
        ),
    )
