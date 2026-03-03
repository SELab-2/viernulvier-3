# models/event.py

from pydantic import BaseModel, model_validator
from typing import Optional
from datetime import datetime


class HallNested(BaseModel):
    name: str
    address: str 
    
class EventResponse(BaseModel):
    id: str # ids are url's
    production_id: str
    hall_id: int
    hall: Optional[HallNested] = None
    starts_at: Optional[datetime]
    ends_at: Optional[datetime]
    order_url: Optional[str]
    external_order_url: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
        
    model_config = {
        "from_attributes": True
    }


class HallCreate(BaseModel):
    name: str
    address: str

class EventCreate(BaseModel):
    production_id: str
    hall_id: Optional[int] = None
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
    production_id: Optional[int] = None
    hall_id: Optional[int] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    order_url: Optional[str] = None
    external_order_url: Optional[str] = None
