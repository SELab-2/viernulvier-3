from datetime import datetime
from typing import List, Optional

from pydantic import ConfigDict
from src.schemas.base_schema import StrictModel
from src.schemas.hall import HallResponse


class PriceResponse(StrictModel):
    id_url: str
    amount: Optional[float] = None
    available: Optional[int] = None
    expires_at: Optional[datetime] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EventResponse(StrictModel):
    id_url: str
    production_id_url: str

    hall: Optional[HallResponse] = None

    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None

    order_url: Optional[str] = None

    price_urls: List[str] = []

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EventCreate(StrictModel):
    production_id_url: str
    hall_id_url: str
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    order_url: Optional[str] = None


class EventUpdate(StrictModel):
    hall_id_url: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    order_url: Optional[str] = None
