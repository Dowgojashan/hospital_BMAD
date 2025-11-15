import uuid
import uuid
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Enum, func, Text
from ..db.base import Base, UUIDType


checkin_method_enum = ("onsite", "online")


class Checkin(Base):
    __tablename__ = "CHECKIN"

    checkin_id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUIDType, ForeignKey("appointment.appointment_id"), nullable=True)
    patient_id = Column(UUIDType, ForeignKey("PATIENT.patient_id"), nullable=False)
    checkin_time = Column(DateTime(timezone=True), nullable=True)
    checkin_method = Column(Enum(*checkin_method_enum, name="checkin_method"), nullable=True)
    ticket_sequence = Column(Integer, nullable=True)
    ticket_number = Column(String, nullable=True)
    cancelled_by = Column(UUIDType, ForeignKey("ADMIN.admin_id"), nullable=True)
    cancel_reason = Column(Text, nullable=True)

    def __repr__(self):
        return f"<Checkin {self.checkin_id} patient={self.patient_id} ticket={self.ticket_number}>"
