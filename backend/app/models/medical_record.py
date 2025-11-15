import uuid
from sqlalchemy import Column, Text, DateTime, ForeignKey, func
from ..db.base import Base, UUIDType


class MedicalRecord(Base):
    __tablename__ = "MEDICAL_RECORD"

    record_id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUIDType, ForeignKey("PATIENT.patient_id"), nullable=False)
    doctor_id = Column(UUIDType, ForeignKey("DOCTOR.doctor_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    summary = Column(Text, nullable=True)

    def __repr__(self):
        return f"<MedicalRecord {self.record_id} patient={self.patient_id}>"
