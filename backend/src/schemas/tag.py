from typing import List, Optional, Sequence
from pydantic import BaseModel, ConfigDict


class TagNameBase(BaseModel):
    language: str
    name: str


class TagNameResponse(TagNameBase):
    model_config = ConfigDict(from_attributes=True)


class TagBase(BaseModel):
    id_url: str


class TagResponse(TagBase):
    names: Sequence[TagNameResponse]

    model_config = ConfigDict(from_attributes=True)


class TagCreate(BaseModel):
    names: List[TagNameBase]


class TagUpdate(BaseModel):
    names: Optional[List[TagNameBase]]
