
from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime
from database import Base

class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    video_path = Column(String, nullable=False)
    image_path = Column(String, nullable=False)
    violation_type = Column(String, nullable=False)
    violation_metadata = Column(JSON, nullable=True)

    def __repr__(self):
        return f"<Violation id={self.id} type={self.violation_type} timestamp={self.timestamp}>"
