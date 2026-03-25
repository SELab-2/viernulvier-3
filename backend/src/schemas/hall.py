from pydantic import BaseModel, ConfigDict
from typing import Optional


class HallSchema(BaseModel):
    name: str
    address: Optional[str]

    model_config = ConfigDict(from_attributes=True)
