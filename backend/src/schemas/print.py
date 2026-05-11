from datetime import datetime
from enum import Enum
from typing import Optional

from src.schemas.base_schema import StrictModel
from src.schemas.pagination import IdPagination


class PrintType(str, Enum):
    POSTER = "poster"
    TIMETABLE = "timetable"
    PROGRAMME = "programme"
    OTHER = "other"


class PrintResponse(StrictModel):
    url: str
    id_url: str
    content_type: str
    title: Optional[str] = None
    description: Optional[str] = None
    print_type: Optional[PrintType] = None
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class PrintListResponse(StrictModel):
    prints: list[PrintResponse]
    pagination: IdPagination
