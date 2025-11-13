import uuid
from sqlalchemy import Column, Date, String, DateTime, ForeignKey, func, Integer # Import String, Integer
from sqlalchemy.dialects.postgresql import UUID

from ..db.base import Base


class Schedule(Base):
    __tablename__ = "SCHEDULE"

    schedule_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("DOCTOR.doctor_id"), nullable=False)
    recurring_group_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    date = Column(Date, nullable=False)
    time_period = Column(String, nullable=False)
    status = Column(String, nullable=False, default='available', server_default='available')
    max_patients = Column(Integer, nullable=False, default=10) # New max_patients column
    booked_patients = Column(Integer, nullable=False, default=0) # New booked_patients column
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<Schedule {self.schedule_id} doctor={self.doctor_id} date={self.date} period={self.time_period}>"
