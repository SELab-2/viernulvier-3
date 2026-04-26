from typing import Optional

from pydantic import ConfigDict

from src.schemas.base_schema import StrictModel


class HistoryResponse(StrictModel):
    id_url: str
    year: int
    language: str
    title: Optional[str] = None
    content: str

    model_config = ConfigDict(from_attributes=True)


class HistoryCreate(StrictModel):
    year: int
    language: str
    title: Optional[str] = None
    content: str


class HistoryUpdate(StrictModel):
    year: Optional[int] = None
    language: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
