from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, PositiveFloat, EmailStr

class TicketCreate(BaseModel):
    amount: PositiveFloat
    notes: Optional[str] = None 
    name: Optional[str] = None
    email: Optional[EmailStr] = None

    model_config = {
        "from_attributes": True
    }

from api.schemas.violation import ViolationOut
from api.schemas.officer import OfficerOut

class TicketOut(BaseModel):
    id: UUID
    violation_id: UUID
    officer_id: UUID
    amount: float
    status: str
    issued_at: datetime
    notes: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    file_path: Optional[str] = None

    violation: Optional[ViolationOut] = None
    officer: Optional[OfficerOut] = None

    model_config = {
        "from_attributes": True
    }
    
class TicketUpdate(BaseModel):
    amount: Optional[PositiveFloat] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    notes: Optional[str] = None