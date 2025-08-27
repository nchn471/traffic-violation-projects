import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

try:
    from ..database import Base
except:
    from database import Base


class Violation(Base):
    __tablename__ = "violations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    camera_id = Column(UUID(as_uuid=True), ForeignKey("cameras.id"), nullable=False)
    version_id = Column(UUID(as_uuid=True), ForeignKey("violation_versions.id"), nullable=True)

    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    vehicle_type = Column(String(50), nullable=True)
    violation_type = Column(String(50), nullable=False)
    license_plate = Column(String(20), nullable=True)
    confidence = Column(Float, nullable=True)

    frame_image_path = Column(String, nullable=False)
    vehicle_image_path = Column(String, nullable=False)
    lp_image_path = Column(String, nullable=True)
    status = Column(String(20), default="pending", nullable=False)

    camera = relationship("Camera", back_populates="violations")

    versions = relationship(
        "ViolationVersion",
        back_populates="violation",
        cascade="all, delete-orphan",
        foreign_keys="[ViolationVersion.violation_id]"  
    )

    current_version = relationship(
        "ViolationVersion",
        foreign_keys=[version_id],
        uselist=False
    )

    ticket = relationship("Ticket", back_populates="violation", uselist=False)


class ViolationVersion(Base):
    __tablename__ = "violation_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    violation_id = Column(UUID(as_uuid=True), ForeignKey("violations.id"), nullable=False)
    officer_id = Column(UUID(as_uuid=True), ForeignKey("officers.id"), nullable=True)

    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    vehicle_type = Column(String(50), nullable=True)
    violation_type = Column(String(50), nullable=False)
    license_plate = Column(String(20), nullable=True)
    confidence = Column(Float, nullable=True)

    frame_image_path = Column(String, nullable=False)
    vehicle_image_path = Column(String, nullable=False)
    lp_image_path = Column(String, nullable=True)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    change_type = Column(String(50), nullable=False)
    
    notes = Column(String(255), nullable=True) 
    source_id = Column(UUID(as_uuid=True), ForeignKey("violation_versions.id"), nullable=True)
    status = Column(String(20), nullable=True)

    # Relationships
    violation = relationship(
        "Violation",
        back_populates="versions",
        foreign_keys=[violation_id]      
    )    
    officer = relationship("Officer", back_populates="violation_versions")
