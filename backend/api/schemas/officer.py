from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional

class OfficerOut(BaseModel):
    id: UUID
    name: str
    email: Optional[EmailStr] = None

    model_config = {
        "from_attributes": True
    }
