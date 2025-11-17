import uuid
from sqlalchemy import Column, Text, DateTime, ForeignKey, func, String
from sqlalchemy.orm import relationship
from ..db.base import Base, UUIDType


class MedicalRecord(Base):
    __tablename__ = "MEDICAL_RECORD"

    record_id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUIDType, ForeignKey("PATIENT.patient_id"), nullable=False)
    doctor_id = Column(UUIDType, ForeignKey("DOCTOR.doctor_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    summary = Column(Text, nullable=True)
    prescription = Column(Text, nullable=True)
    department = Column(String, nullable=True)

    patient = relationship("Patient", back_populates="medical_records")
    doctor = relationship("Doctor", back_populates="medical_records")

    def __repr__(self):
        return f"<MedicalRecord {self.record_id} patient={self.patient_id}>"
