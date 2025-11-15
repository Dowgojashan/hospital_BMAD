# backend/app/models/appointment.py
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship

from app.db.base import Base, UUIDType

class Appointment(Base):
    __tablename__ = "appointment"

    appointment_id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUIDType, ForeignKey("PATIENT.patient_id"), nullable=False)
    doctor_id = Column(UUIDType, ForeignKey("DOCTOR.doctor_id"), nullable=False)
    date = Column(Date, nullable=False)
    time_period = Column(String, nullable=False) # e.g., "morning", "afternoon", "night"
    status = Column(String, nullable=False, default="scheduled") # e.g., "scheduled", "confirmed", "waitlist", "cancelled", "checked_in", "waiting", "called", "in_consult", "completed", "no_show"
    created_at = Column(DateTime(timezone=True), default=datetime.now, nullable=False)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
