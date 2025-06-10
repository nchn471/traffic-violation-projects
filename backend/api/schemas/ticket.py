from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, PositiveFloat

class TicketCreate(BaseModel):
    amount: PositiveFloat
    notes: Optional[str] = None 

    model_config = {
        "from_attributes": True
    }

class TicketOut(BaseModel):
    id: UUID
    violation_id: UUID
    officer_id: UUID
    amount: float
    status: str
    issued_at: datetime
    notes: Optional[str] = None

    model_config = {
        "from_attributes": True
    }
