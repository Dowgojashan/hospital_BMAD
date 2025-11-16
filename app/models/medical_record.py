import uuid
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from ..db.base import Base, UUIDType

class MedicalRecord(Base):
    __tablename__ = "MEDICAL_RECORD"

    record_id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUIDType, ForeignKey("PATIENT.patient_id"), nullable=False)
    doctor_id = Column(UUIDType, ForeignKey("DOCTOR.doctor_id"), nullable=False)
    appointment_id = Column(UUIDType, ForeignKey("APPOINTMENT.appointment_id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    summary = Column(Text, nullable=True)

    # Relationships
    patient = relationship("Patient", backref="medical_records")
    doctor = relationship("Doctor", backref="authored_medical_records")
    appointment = relationship("Appointment", backref="medical_record")

    def __repr__(self):
        return f"<MedicalRecord {self.record_id} patient={self.patient_id} doctor={self.doctor_id}>"
