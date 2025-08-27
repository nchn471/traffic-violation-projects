from uuid import UUID
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from typing import Dict, Any


class CameraBase(BaseModel):
    name: str
    location: Optional[str]
    folder_path: str
    config: Optional[Dict[str, Any]]


class CameraCreate(CameraBase):
    pass


class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    folder_path: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


class CameraOut(CameraBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


