from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from src.schemas.hall import HallSchema


class PriceResponse(BaseModel):
    id_url: str
    amount: Optional[float] = None
    available: Optional[int] = None
    expires_at: Optional[datetime] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EventResponse(BaseModel):
    id_url: str
    production_id_url: str
    hall_id_url: str

    hall: Optional[HallSchema] = None

    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None

    order_url: Optional[str] = None

    price_urls: List[str] = []

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EventCreate(BaseModel):
    production_id_url: str
    hall_id_url: str
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    order_url: Optional[str] = None


class EventUpdate(BaseModel):
    hall_id_url: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    order_url: Optional[str] = None
