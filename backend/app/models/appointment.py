import uuid
from sqlalchemy import Column, String, Date, DateTime, ForeignKey, func, Enum
from sqlalchemy.dialects.postgresql import UUID

from ..db.base import Base


appointment_status_enum = (
    "scheduled",
    "confirmed",
    "waitlist",
    "cancelled",
    "checked_in",
    "waiting",
    "called",
    "in_consult",
    "completed",
    "no_show",
)


class Appointment(Base):
    __tablename__ = "APPOINTMENT"

    appointment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("PATIENT.patient_id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("DOCTOR.doctor_id"), nullable=False)
    date = Column(Date, nullable=False)
    time_period = Column(String, nullable=False)
    
    # [修正] 在這裡加入 create_type=False
    status = Column(Enum(*appointment_status_enum, name="appointment_status", create_type=False), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<Appointment {self.appointment_id} {self.patient_id} {self.doctor_id} {self.date}>"