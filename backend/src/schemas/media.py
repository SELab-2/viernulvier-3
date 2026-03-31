from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from src.schemas.pagination import Pagination


class MediaResponse(BaseModel):
    id_url: str
    url: str
    production: str
    content_type: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MediaListResponse(BaseModel):
    media: list[MediaResponse] = Field(default_factory=list)
    pagination: Pagination = Field(default_factory=Pagination)
