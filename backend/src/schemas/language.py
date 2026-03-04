from pyparsing import Optional
from pydantic import BaseModel, ConfigDict

class LanguageCreate(BaseModel):
    id: int
    name: str

class LanguageUpdate(BaseModel):
    name: Optional[str] = None

class LanguageResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)