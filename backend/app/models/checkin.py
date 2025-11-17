import uuid
import uuid
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Enum, func, Text
from sqlalchemy.orm import relationship
from ..db.base import Base, UUIDType


checkin_method_enum = ("onsite", "online")
checkin_status_enum = ("checked_in", "no_show", "seen") # Define new enum for status


class Checkin(Base):
    __tablename__ = "CHECKIN"

    checkin_id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUIDType, ForeignKey("appointment.appointment_id"), nullable=True)
    patient_id = Column(UUIDType, ForeignKey("PATIENT.patient_id"), nullable=False)
    checkin_time = Column(DateTime(timezone=True), nullable=True)
    checkin_method = Column(Enum(*checkin_method_enum, name="checkin_method"), nullable=True)
    ticket_sequence = Column(Integer, nullable=True)
    ticket_number = Column(String, nullable=True)
    status = Column(Enum(*checkin_status_enum, name="checkin_status"), nullable=False, default="checked_in") # New status column
    cancelled_by = Column(UUIDType, ForeignKey("ADMIN.admin_id"), nullable=True)
    cancel_reason = Column(Text, nullable=True)

    # Relationship to Appointment
    appointment = relationship("Appointment", backref="checkins")

    def __repr__(self):
        return f"<Checkin {self.checkin_id} patient={self.patient_id} ticket={self.ticket_number}>"
