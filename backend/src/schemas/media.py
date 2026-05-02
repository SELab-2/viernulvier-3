from datetime import datetime

from pydantic import ConfigDict, Field
from src.schemas.base_schema import StrictModel
from src.schemas.pagination import IdPagination


class MediaResponse(StrictModel):
    id_url: str
    url: str
    production_id_url: str
    content_type: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MediaListResponse(StrictModel):
    media: list[MediaResponse] = Field(default_factory=list)
    pagination: IdPagination = Field(default_factory=IdPagination)
