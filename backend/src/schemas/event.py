# models/event.py

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class HallNested(BaseModel):
    name: str
    address: str 
    
class EventResponse(BaseModel):
    id: str # ids are url's
    production_id: str
    hall: HallNested
    starts_at: Optional[datetime]
    ends_at: Optional[datetime]
    order_url: Optional[str]
    external_order_url: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True
        
    model_config = {
        "from_attributes": True
    }
    
