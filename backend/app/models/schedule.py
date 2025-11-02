import uuid
from sqlalchemy import Column, Date, Time, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID

from ..db.base import Base


class Schedule(Base):
    __tablename__ = "SCHEDULE"

    schedule_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("DOCTOR.doctor_id"), nullable=False)
    date = Column(Date, nullable=False)
    start = Column(Time, nullable=False)
    end = Column(Time, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<Schedule {self.schedule_id} doctor={self.doctor_id} date={self.date}>"
