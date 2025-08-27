from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, PositiveFloat, EmailStr

from api.schemas.officer import OfficerOut


class TicketBase(BaseModel):
    amount: PositiveFloat
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    notes: Optional[str] = None
    violation_id: Optional[UUID] = None
    officer_id: Optional[UUID] = None
    status: Optional[str] = None
    issued_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    amount: Optional[PositiveFloat] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    notes: Optional[str] = None

    model_config = {
        "from_attributes": True
    }


class TicketOut(TicketBase):
    id: UUID
    officer: Optional[OfficerOut] = None
    model_config = {
        "from_attributes": True
    }
    
class TicketVersionOut(TicketBase):
    id: UUID
    ticket_id: UUID
    updated_at: datetime
    change_type: str

    officer: Optional[OfficerOut] = None

    model_config = {
        "from_attributes": True
    }
