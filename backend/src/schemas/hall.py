from pydantic import BaseModel, ConfigDict
from typing import Optional


class HallResponse(BaseModel):
    id_url: str
    name: str
    address: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class HallCreate(BaseModel):
    name: str
    address: Optional[str] = None


class HallUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
