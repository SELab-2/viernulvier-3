from enum import Enum

from sqlalchemy import TIMESTAMP, Column, DateTime
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.sql import func

from src.database import Base


class SyncType(str, Enum):
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"


class ResourceType(str, Enum):
    PRODUCTION = "production"
    EVENT = "event"
    GALLERY = "gallery"
    EVENT_PRICES = "event_prices"
    GENRES = "genres"
    HALLS = "halls"
    TAGS = "tags"


class SyncState(Base):
    __tablename__ = "sync_state"

    resource = Column(SQLEnum(ResourceType), primary_key=True)
    sync_type = Column(SQLEnum(SyncType), primary_key=True)

    last_timestamp = Column(DateTime(timezone=True), nullable=False)

    updated_at = Column(
        TIMESTAMP, server_default=func.now(), server_onupdate=func.now()
    )
