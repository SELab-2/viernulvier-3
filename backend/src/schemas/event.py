# models/event.py

from pydantic import BaseModel, model_validator, ConfigDict
from typing import Optional, List
from datetime import datetime




class PriceResponse(BaseModel):
    id: str
    label: Optional[str]
    amount: Optional[float]
    available: Optional[int]
    expires_at: Optional[datetime]

    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
    
class HallNested(BaseModel):
    name: str
    address: str 
    
    model_config = ConfigDict(from_attributes=True)
    
class EventResponse(BaseModel):
    id: str # ids are url's
    production_id: str
    hall_id: str
    hall: Optional[HallNested] = None
    starts_at: Optional[datetime]
    ends_at: Optional[datetime]
    order_url: Optional[str]
    external_order_url: Optional[str]
    prices: List[str] # str because url's
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
        
    model_config = ConfigDict(from_attributes=True)


class HallCreate(BaseModel):
    name: str
    address: str

class EventCreate(BaseModel):
    production_id: str
    hall_id: str
    hall: Optional[HallCreate] = None
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
    price_id: Optional[str] = None
    hall_id: Optional[int] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    order_url: Optional[str] = None
    external_order_url: Optional[str] = None
