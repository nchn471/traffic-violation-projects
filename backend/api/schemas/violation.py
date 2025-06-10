from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, PositiveFloat


class ViolationBase(BaseModel):
    record_id: UUID
    timestamp: datetime
    vehicle_type: Optional[str]
    violation_type: str
    license_plate: Optional[str]
    confidence: Optional[float]
    frame_image_path: str
    vehicle_image_path: str
    lp_image_path: Optional[str]
    status: Optional[str] = "pending"
    
    model_config = {
        "from_attributes": True
    }

class ViolationCreate(ViolationBase):
    pass

class ViolationUpdate(BaseModel):
    vehicle_type: Optional[str] = None
    violation_type: Optional[str] = None
    license_plate: Optional[str] = None
    confidence: Optional[float] = None
    status: Optional[str] = None

    model_config = {
        "from_attributes": True
    }

class ViolationOut(ViolationBase):
    id: UUID
    version_id: Optional[UUID]

    model_config = {
        "from_attributes": True
    }

class ViolationVersionOut(BaseModel):
    id: UUID
    violation_id: UUID
    officer_id: UUID
    updated_at: datetime
    change_type: str
    details: Optional[dict]

    model_config = {
        "from_attributes": True
    }

class Pagination(BaseModel):
    page: int
    limit: int
    total: int
    totalPages: int

    model_config = {
        "from_attributes": True
    }

class PaginatedViolations(BaseModel):
    pagination: Pagination
    data: List[ViolationOut]

    model_config = {
        "from_attributes": True
    }

