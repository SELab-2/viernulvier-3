from pydantic import BaseModel, ConfigDict


class HallSchema(BaseModel):
    name: str
    address: str

    model_config = ConfigDict(from_attributes=True)
