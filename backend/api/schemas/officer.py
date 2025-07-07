from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class OfficerOut(BaseModel):
    id: UUID
    name: str
    username: str
    role: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class OfficerUpdate(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None