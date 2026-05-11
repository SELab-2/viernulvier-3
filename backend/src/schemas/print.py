from datetime import datetime
from typing import Optional

from src.schemas.base_schema import StrictModel

from src.schemas.pagination import IdPagination


class PrintResponse(StrictModel):
    url: str
    id_url: str
    content_type: str
    title: Optional[str] = None
    description: Optional[str] = None
    print_type: Optional[str] = None
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class PrintListResponse(StrictModel):
    prints: list[PrintResponse]
    pagination: IdPagination
