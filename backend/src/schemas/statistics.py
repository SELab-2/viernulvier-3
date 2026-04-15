from pydantic import BaseModel


class StatisticsResponse(BaseModel):
    productions_count: int = 0
    events_count: int = 0
    unique_artists_count: int = 0
    tags_count: int = 0
