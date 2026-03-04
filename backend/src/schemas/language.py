from pyparsing import Optional
from pydantic import BaseModel, ConfigDict

# ToDo: Replace id with varchar name (because unique) and remove field name.
class LanguageCreate(BaseModel):
    id: int
    name: str

class LanguageUpdate(BaseModel):
    name: Optional[str] = None

class LanguageResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)