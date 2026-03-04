from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class TagName(BaseModel):
    language_id: int
    name: str

class TagNameResponse(TagName):
    model_config = ConfigDict(from_attributes=True)


class Tag(BaseModel):
    id: str

class TagResponse(Tag):
    names: List[TagNameResponse]

    model_config = ConfigDict(from_attributes=True)


class TagCreate(BaseModel):
    names: List[TagName]

class TagUpdate(BaseModel):
    names: Optional[List[TagName]]


