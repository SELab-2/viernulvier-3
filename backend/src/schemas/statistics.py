from pydantic import BaseModel, Field
from src.schemas.tag import TagResponse


class StatisticsResponse(BaseModel):
    productions_count: int = 0
    events_count: int = 0
    unique_artists_count: int = 0
    tags: list[TagResponse] = Field(default_factory=list)
