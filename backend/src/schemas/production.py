from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime


class Pagination(BaseModel):
    next_cursor: int | None = None
    has_more: bool = False


# The response for a production info in a specific language.
class ProductionInfoResponse(BaseModel):
    production_id_url: str
    language: str
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
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # A production has a list of event urls (for the different events of that production).
    # A production has a list of infos (for different languages).
    production_infos: list[ProductionInfoResponse] = Field(default_factory=list)
    events: list[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# The response for a list of productions, including pagination info.
class ProductionListResponse(BaseModel):
    productions: list[ProductionResponse] = Field(default_factory=list)
    pagination: Pagination = Field(default_factory=Pagination)


# When a new production info is created in a specific language.
class ProductionInfoCreate(BaseModel):
    language: str

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
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    production_info: ProductionInfoCreate


class ProductionInfoUpdate(BaseModel):
    language: str

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
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    production_infos: Optional[list[ProductionInfoUpdate]] = None
    remove_languages: list[str] | None = None
