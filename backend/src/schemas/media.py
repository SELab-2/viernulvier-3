from pydantic import BaseModel, ConfigDict
from typing import Optional

class MediaCreate(BaseModel):
    id: int
    media: list[str] #urls?

class MediaUpdate(BaseModel):
    media: Optional[list[str]] = None

class MediaResponse(BaseModel):
    id: int
    media: list[str]

    model_config = ConfigDict(from_attributes=True)