import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
try:
    from ..database import Base
except:
    from database import Base
    
class Officer(Base):
    __tablename__ = "officers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String, nullable=False)  
    avatar_url = Column(String, nullable=True) 
    role = Column(String(20), default="officer", nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    edits = relationship("ViolationVersion", back_populates="officer")
    tickets = relationship("Ticket", back_populates="officer")
    ticket_edits = relationship("TicketVersion", back_populates="officer")
    
    