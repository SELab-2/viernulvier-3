from typing import List, Optional, Sequence

from pydantic import ConfigDict
from src.schemas.base_schema import StrictModel


class TagNameBase(StrictModel):
    language: str
    name: str


class TagNameResponse(TagNameBase):
    model_config = ConfigDict(from_attributes=True)


class TagBase(StrictModel):
    id_url: str


class TagResponse(TagBase):
    names: Sequence[TagNameResponse]

    model_config = ConfigDict(from_attributes=True)


class TagCreate(StrictModel):
    names: List[TagNameBase]


class TagUpdate(StrictModel):
    names: Optional[List[TagNameBase]]
