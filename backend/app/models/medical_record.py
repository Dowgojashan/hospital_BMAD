import uuid
from sqlalchemy import Column, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID

from ..db.base import Base


class MedicalRecord(Base):
    __tablename__ = "MEDICAL_RECORD"

    record_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("PATIENT.patient_id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("DOCTOR.doctor_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    summary = Column(Text, nullable=True)

    def __repr__(self):
        return f"<MedicalRecord {self.record_id} patient={self.patient_id}>"
