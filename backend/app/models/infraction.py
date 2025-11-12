import uuid
from sqlalchemy import Column, DateTime, Date, Boolean, String, ForeignKey, func, Enum
from sqlalchemy.dialects.postgresql import UUID

from ..db.base import Base


infraction_type_enum = ("no_show", "late_cancel", "other")


class Infraction(Base):
    __tablename__ = "INFRACTION"

    infraction_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("PATIENT.patient_id"), nullable=False)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointment.appointment_id"), nullable=True)
    infraction_type = Column(Enum(*infraction_type_enum, name="infraction_type"), nullable=False)
    occurred_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    penalty_applied = Column(Boolean, nullable=False, default=False)
    penalty_until = Column(Date, nullable=True)
    notes = Column(String, nullable=True)

    def __repr__(self):
        return f"<Infraction {self.infraction_id} patient={self.patient_id} type={self.infraction_type}>"
