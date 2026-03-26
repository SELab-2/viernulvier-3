# backend/src/schemas/media.py

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class MediaResponse(BaseModel):
    id_url: str
    url: str
    production: str
    content_type: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)