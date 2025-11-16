from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

class MedicalRecordBase(BaseModel):
    patient_id: UUID
    doctor_id: UUID
    appointment_id: Optional[UUID] = None
    summary: Optional[str] = None

class MedicalRecordCreate(MedicalRecordBase):
    pass

class MedicalRecordUpdate(MedicalRecordBase):
    patient_id: Optional[UUID] = None
    doctor_id: Optional[UUID] = None
    summary: Optional[str] = None

class MedicalRecordPublic(MedicalRecordBase):
    record_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
