from uuid import UUID
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CameraBase(BaseModel):
    name: str
    location: str
    folder_path: str


class CameraCreate(CameraBase):
    pass


class CameraUpdate(BaseModel):
    name: Optional[str]
    location: Optional[str]
    folder_path: Optional[str]


class CameraOut(CameraBase):
    id: UUID
    created_at: datetime
    updated_at: datetime


    model_config = {
        "from_attributes": True
    }
