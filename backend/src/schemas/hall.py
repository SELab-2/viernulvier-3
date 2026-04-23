from typing import Optional

from pydantic import ConfigDict
from src.schemas.base_schema import StrictModel


class HallResponse(StrictModel):
    id_url: str
    name: str
    address: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class HallCreate(StrictModel):
    name: str
    address: Optional[str] = None


class HallUpdate(StrictModel):
    name: Optional[str] = None
    address: Optional[str] = None
