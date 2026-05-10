from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from src.schemas.pagination import IdPagination


class PrintResponse(BaseModel):
    id: int
    url: str
    id_url: str
    content_type: str
    label: Optional[str] = None
    print_type: Optional[str] = None
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class PrintListResponse(BaseModel):
    prints: list[PrintResponse]
    pagination: IdPagination