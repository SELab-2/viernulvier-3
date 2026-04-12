from datetime import datetime
from typing import Optional

from pydantic import ConfigDict, Field
from src.schemas.base_schema import StrictModel
from src.schemas.pagination import Pagination
from src.schemas.tag import TagResponse


# The response for a production info in a specific language.
class ProductionInfoResponse(StrictModel):
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


class ProductionResponse(StrictModel):
    id_url: str
    performer_type: Optional[str] = None
    attendance_mode: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # A production has a list of event urls (for the different events of that production).
    # A production has a list of infos (for different languages).
    # A production has a list of tags.
    production_infos: list[ProductionInfoResponse] = Field(default_factory=list)
    # TODO: must be event_id_urls
    events: list[str] = Field(default_factory=list)
    tags: list[TagResponse] = Field(default_factory=list)  # tag_object

    model_config = ConfigDict(from_attributes=True)


# The response for a list of productions, including pagination info.
class ProductionListResponse(StrictModel):
    productions: list[ProductionResponse] = Field(default_factory=list)
    pagination: Pagination = Field(default_factory=Pagination)


# When a new production info is created in a specific language.
class ProductionInfoCreate(StrictModel):
    language: str

    title: Optional[str] = None
    supertitle: Optional[str] = None
    artist: Optional[str] = None
    tagline: Optional[str] = None
    teaser: Optional[str] = None
    description: Optional[str] = None
    info: Optional[str] = None


# When a new production is created (has one or more info entries).
class ProductionCreate(StrictModel):
    performer_type: Optional[str] = None
    attendance_mode: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    production_info: ProductionInfoCreate
    tag_id_urls: list[str] = []


class ProductionInfoUpdate(StrictModel):
    language: str

    title: Optional[str] = None
    supertitle: Optional[str] = None
    artist: Optional[str] = None
    tagline: Optional[str] = None
    teaser: Optional[str] = None
    description: Optional[str] = None
    info: Optional[str] = None


class ProductionUpdate(StrictModel):
    performer_type: Optional[str] = None
    attendance_mode: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    production_infos: Optional[list[ProductionInfoUpdate]] = None
    tag_id_urls: Optional[list[str]] = None
    remove_languages: list[str] | None = None
