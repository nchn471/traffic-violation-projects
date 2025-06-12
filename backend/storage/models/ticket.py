import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
try:
    from ..database import Base
except:
    from database import Base
    
class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    violation_id = Column(UUID(as_uuid=True), ForeignKey("violations.id"), unique=True, nullable=False)
    officer_id = Column(UUID(as_uuid=True), ForeignKey("officers.id"), nullable=False)

    amount = Column(Float, nullable=False)
    status = Column(String(20), default="pending", nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(String(500), nullable=True)
    name = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)
    file_path = Column(String, nullable=True)

    current_version_id = Column(UUID(as_uuid=True), ForeignKey("ticket_versions.id"), nullable=True)

    violations = relationship("Violation", back_populates="ticket")
    officer = relationship("Officer", back_populates="tickets")

    current_version = relationship("TicketVersion", foreign_keys=[current_version_id], uselist=False)
    versions = relationship("TicketVersion", back_populates="ticket", cascade="all, delete-orphan")


class TicketVersion(Base):
    __tablename__ = "ticket_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id"), nullable=False)
    officer_id = Column(UUID(as_uuid=True), ForeignKey("officers.id"), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    change_type = Column(String(50), nullable=False)
    details = Column(String, nullable=False)  

    ticket = relationship("Ticket", back_populates="versions")
    officer = relationship("Officer", back_populates="ticket_edits")
