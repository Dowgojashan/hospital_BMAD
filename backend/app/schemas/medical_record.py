from pydantic import BaseModel
from typing import Optional
import datetime
import uuid


class MedicalRecordBase(BaseModel):
    summary: Optional[str] = None


class MedicalRecordCreate(MedicalRecordBase):
    patient_id: uuid.UUID


class MedicalRecordUpdate(MedicalRecordBase):
    pass


class MedicalRecord(MedicalRecordBase):
    record_id: uuid.UUID
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    created_at: datetime.datetime
    doctor_name: Optional[str] = None
    patient_name: Optional[str] = None

    class Config:
        from_attributes = True
