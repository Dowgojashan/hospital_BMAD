# backend/app/models/appointment.py
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, ForeignKey, DateTime, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base

class Appointment(Base):
    __tablename__ = "appointment"

    appointment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("PATIENT.patient_id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("DOCTOR.doctor_id"), nullable=False)
    date = Column(Date, nullable=False)
    time_period = Column(String, nullable=False) # e.g., "morning", "afternoon", "night"
    status = Column(String, nullable=False, default="scheduled") # e.g., "scheduled", "confirmed", "cancelled", "no_show"
    created_at = Column(DateTime(timezone=True), default=datetime.now, nullable=False)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
