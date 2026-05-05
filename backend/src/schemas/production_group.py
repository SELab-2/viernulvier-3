from pydantic import ConfigDict, Field

from src.schemas.base_schema import StrictModel


class ProductionGroupBase(StrictModel):
    title: str
    is_public_filter: bool = True


class ProductionGroupResponse(ProductionGroupBase):
    id_url: str
    production_id_urls: list[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ProductionGroupCreate(ProductionGroupBase):
    production_id_urls: list[str] = Field(default_factory=list)


class ProductionGroupUpdate(StrictModel):
    title: str | None = None
    is_public_filter: bool | None = None
    production_id_urls: list[str] | None = None
