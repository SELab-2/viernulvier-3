from typing import List, Optional, Sequence

from pydantic import ConfigDict
from src.schemas.base_schema import StrictModel


class HallNameBase(StrictModel):
    language: str
    name: str


class HallNameResponse(HallNameBase):
    model_config = ConfigDict(from_attributes=True)


class HallBase(StrictModel):
    id_url: str
    address: Optional[str] = None


class HallResponse(HallBase):
    names: Sequence[HallNameResponse]

    model_config = ConfigDict(from_attributes=True)


class HallCreate(StrictModel):
    names: List[HallNameBase]
    address: Optional[str] = None


class HallUpdate(StrictModel):
    names: Optional[List[HallNameBase]] = None
    address: Optional[str] = None
