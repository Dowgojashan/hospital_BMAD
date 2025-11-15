import uuid
from sqlalchemy import Column, Date, String, DateTime, ForeignKey, func, Integer # Import String, Integer
from sqlalchemy.orm import relationship

from ..db.base import Base, UUIDType


class Schedule(Base):
    __tablename__ = "SCHEDULE"

    schedule_id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    doctor_id = Column(UUIDType, ForeignKey("DOCTOR.doctor_id"), nullable=False)
    recurring_group_id = Column(UUIDType, nullable=True, index=True)
    date = Column(Date, nullable=False)
    time_period = Column(String, nullable=False)
    status = Column(String, nullable=False, default='available', server_default='available')
    max_patients = Column(Integer, nullable=False, default=10) # New max_patients column
    booked_patients = Column(Integer, nullable=False, default=0) # New booked_patients column
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    leave_request = relationship("LeaveRequest", back_populates="schedule", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Schedule {self.schedule_id} doctor={self.doctor_id} date={self.date} period={self.time_period}>"
