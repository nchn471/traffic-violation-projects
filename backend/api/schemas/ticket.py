from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, PositiveFloat, EmailStr

from api.schemas.violation import ViolationOut
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
    violation: Optional[ViolationOut] = None
    officer: Optional[OfficerOut] = None

    model_config = {
        "from_attributes": True
    }


# ========================
# Ticket Version Schemas
# ========================

class TicketVersionBase(BaseModel):
    amount: PositiveFloat
    status: str
    issued_at: datetime
    notes: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None

    model_config = {
        "from_attributes": True
    }


class TicketVersionOut(TicketVersionBase):
    id: UUID
    ticket_id: UUID
    officer_id: UUID
    updated_at: datetime
    change_type: str

    officer: Optional[OfficerOut] = None

    model_config = {
        "from_attributes": True
    }
