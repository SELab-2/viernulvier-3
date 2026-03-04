from pydantic import BaseModel, ConfigDict
from typing import Optional

# ToDo: Replace id with varchar name (because unique) and remove field name.
class MediaCreate(BaseModel):
    id: int
    media: list[str] #urls?

class MediaUpdate(BaseModel):
    media: Optional[list[str]] = None

class MediaResponse(BaseModel):
    id: int
    media: list[str]

    model_config = ConfigDict(from_attributes=True)