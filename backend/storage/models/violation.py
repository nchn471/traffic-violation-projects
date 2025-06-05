from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from ..database import Base

class Violation(Base):
    __tablename__ = "violations"

    id = Column(UUID(as_uuid=True), primary_key=True)
    timestamp = Column(DateTime, default=datetime.now(), nullable=False)
    location = Column(String(100), nullable=True)  
    vehicle_type = Column(String(50), nullable=True)
    violation_type = Column(String(50), nullable=False)
    license_plate = Column(String(20), nullable=True)
    frame_image_path = Column(String, nullable=False)
    vehicle_image_path = Column(String, nullable=False)
    lp_image_path = Column(String, nullable=True)
    confidence = Column(Float, nullable=True) 

    def __repr__(self):
        return (f"<Violation id={self.id} type={self.violation_type} "
                f"timestamp={self.timestamp} license_plate={self.license_plate} confidence={self.confidence}>")
