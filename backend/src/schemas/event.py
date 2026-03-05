
from pydantic import BaseModel, model_validator, ConfigDict
from typing import Optional, List
from datetime import datetime
from src.schemas.hall import HallSchema


class PriceResponse(BaseModel):
    id: str
    label: Optional[str] = None
    amount: Optional[float] = None
    available: Optional[int] = None
    expires_at: Optional[datetime] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
    
    
class EventResponse(BaseModel):
    id: str # ids are url's
    production_id: str
    hall_id: str

    hall: Optional[HallSchema] = None

    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None

    order_url: Optional[str] = None
    external_order_url: Optional[str] = None

    prices: List[str] = []  # list of price urls

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)




class EventCreate(BaseModel):
    production_id: str
    hall_id: Optional[str] = None
    hall: Optional[HallSchema] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    order_url: Optional[str] = None
    external_order_url: Optional[str] = None
    
    @model_validator(mode="after")
    def validate_hall_input(self):
        if not self.hall_id and not self.hall:
            raise ValueError("You must provide either hall_id or hall")
        if self.hall_id and self.hall:
            raise ValueError("Provide either hall_id or hall, not both")
        return self
    

class EventUpdate(BaseModel):
    production_id: Optional[str] = None
    hall_id: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    order_url: Optional[str] = None
    external_order_url: Optional[str] = None
