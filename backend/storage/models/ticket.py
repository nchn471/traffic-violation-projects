import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    violation_id = Column(UUID(as_uuid=True), ForeignKey("violations.id"), unique=True, nullable=False)
    officer_id = Column(UUID(as_uuid=True), ForeignKey("officers.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(20), default="pending", nullable=False)  
    issued_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    violation = relationship("Violation", back_populates="ticket")
    officer = relationship("Officer", back_populates="tickets")
