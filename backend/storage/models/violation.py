import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base

class Violation(Base):
    __tablename__ = "violations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_id = Column(UUID(as_uuid=True), ForeignKey("camera_records.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    vehicle_type = Column(String(50), nullable=True)
    violation_type = Column(String(50), nullable=False)
    license_plate = Column(String(20), nullable=True)
    confidence = Column(Float, nullable=True)
    frame_image_path = Column(String, nullable=False)
    vehicle_image_path = Column(String, nullable=False)
    lp_image_path = Column(String, nullable=True)
    status = Column(String(20), default="pending", nullable=False)

    record = relationship("CameraRecord", back_populates="violations")
    versions = relationship("ViolationVersion", back_populates="violation")


class ViolationVersion(Base):
    __tablename__ = "violation_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    violation_id = Column(UUID(as_uuid=True), ForeignKey("violations.id"), nullable=False)
    officer_id = Column(UUID(as_uuid=True), ForeignKey("officers.id"), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    change_type = Column(String(50), nullable=False) 
    details = Column(JSON, nullable=True)  

    violation = relationship("Violation", back_populates="versions")
    officer = relationship("Officer", back_populates="edits")
