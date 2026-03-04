from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ProductionInfoCreate(BaseModel):
    production_id: int
    language_id: int
    title: Optional[str]
    supertitle: Optional[str]
    artist: Optional[str]
    tagline: Optional[str]
    teaser: Optional[str]
    description: Optional[str]
    info: Optional[str]

class ProductionCreate(BaseModel):
    performer_type: Optional[str]
    attendance_mode: Optional[str]
    media_gallery_id: Optional[int]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
   
class ProductionInfoUpdate(BaseModel):
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

class ProductionInfoResponse(BaseModel):
    production_id: int
    language_id: int
    title: Optional[str]
    supertitle: Optional[str]
    artist: Optional[str]
    tagline: Optional[str]
    teaser: Optional[str]
    description: Optional[str]
    info: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class ProductionResponse(BaseModel):
    id: str
    performer_type: Optional[str]
    attendance_mode: Optional[str]
    media_gallery_id: Optional[int]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    # Get all production infos for this production (if multiple languages are supported, there will be multiple production infos).
    info: list[ProductionInfoResponse]

    model_config = ConfigDict(from_attributes=True)