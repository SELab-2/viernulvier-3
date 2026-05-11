from datetime import datetime
from enum import Enum
from typing import Optional

from src.schemas.base_schema import StrictModel
from src.schemas.pagination import IdPagination


class VisualType(str, Enum):
    POSTER = "poster"
    TIMETABLE = "timetable"
    PROGRAMME = "programme"
    VIDEO = "video"
    OTHER = "other"


class VisualResponse(StrictModel):
    url: str
    id_url: str
    content_type: str
    title: Optional[str] = None
    description: Optional[str] = None
    visual_type: Optional[VisualType] = None
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class VisualListResponse(StrictModel):
    visuals: list[VisualResponse]
    pagination: IdPagination
