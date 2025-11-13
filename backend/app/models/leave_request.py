import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from ..db.base import Base

class LeaveRequest(Base):
    __tablename__ = "LEAVE_REQUEST"

    leave_request_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    schedule_id = Column(UUID(as_uuid=True), ForeignKey("SCHEDULE.schedule_id"), nullable=False, unique=True)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("DOCTOR.doctor_id"), nullable=False)
    reason = Column(Text, nullable=False)
    requested_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    schedule = relationship("Schedule", back_populates="leave_request")

    def __repr__(self):
        return f"<LeaveRequest {self.leave_request_id} for schedule {self.schedule_id}>"
