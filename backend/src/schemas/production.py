from enum import Enum

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
   
class Pagination(BaseModel):
    next_cursor: int | None = None
    has_more: bool = False

class UpdateAction(str, Enum):
    UPSERT = "upsert"
    DELETE = "delete"

# The response for a production info in a specific language.
class ProductionInfoResponse(BaseModel):
    #id_url: str
    production_id_url: str
    language_id_url: str
    title: Optional[str] = None
    supertitle: Optional[str] = None
    artist: Optional[str] = None 
    tagline: Optional[str] = None
    teaser: Optional[str] = None 
    description: Optional[str] = None
    info: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ProductionResponse(BaseModel):
    id_url: str
    performer_type: Optional[str] = None
    attendance_mode: Optional[str] = None
    media_gallery_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # A production has a list of event urls (for the different events of that producttion).
    # A production has a list of info urls (for different languages). 
    info: list[ProductionInfoResponse] = Field(default_factory=list)
    events: list[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

# The response for a list of productions, including pagination info.
class ProductionListResponse(BaseModel):
    productions: list[ProductionResponse] = Field(default_factory=list)
    pagination: Pagination = Field(default_factory=Pagination)

# When a new production info is created in a specific language.
class ProductionInfoCreate(BaseModel):
    production_id: int
    language_id: int
    title: Optional[str] = None
    supertitle: Optional[str] = None
    artist: Optional[str] = None
    tagline: Optional[str] = None
    teaser: Optional[str] = None    
    description: Optional[str] = None
    info: Optional[str] = None

# When a new production is created (has one or more info entries).
class ProductionCreate(BaseModel):
    performer_type: Optional[str] = None
    attendance_mode: Optional[str] = None
    media_gallery_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ProductionInfoUpdate(BaseModel):
    language_id: int
    action: UpdateAction = UpdateAction.UPSERT

    title: Optional[str] = None
    supertitle: Optional[str] = None
    artist: Optional[str] = None
    tagline: Optional[str] = None
    teaser: Optional[str] = None
    description: Optional[str] = None
    info: Optional[str] = None

class ProductionUpdate(BaseModel):
    performer_type: Optional[str] = None
    attendance_mode: Optional[str] = None
    media_gallery_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    production_infos: Optional[list[ProductionInfoUpdate]] = None