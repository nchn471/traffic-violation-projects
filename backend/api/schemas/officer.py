from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class OfficerOut(BaseModel):
    id: UUID
    name: str
    username: str
    role: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
