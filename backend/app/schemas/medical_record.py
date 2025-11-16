from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
import uuid


class MedicalRecordBase(BaseModel):
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    appointment_id: Optional[uuid.UUID] = None
    summary: Optional[str] = None


class MedicalRecordCreate(MedicalRecordBase):
    # All fields are inherited from MedicalRecordBase,
    # and patient_id, doctor_id are required as per story-e1
    pass


class MedicalRecordUpdate(BaseModel):
    summary: Optional[str] = None
    # Only summary is updatable as per story-e1
    # patient_id, doctor_id, appointment_id are not meant to be updated directly via this schema
    # If appointment_id needs to be updated, a separate field or schema might be considered
    # For now, sticking to the story's explicit requirement for summary update.


class MedicalRecordPublic(MedicalRecordBase):
    model_config = ConfigDict(from_attributes=True)

    record_id: uuid.UUID
    created_at: datetime

    # Optionally, include relationships if they are to be eagerly loaded and returned
    # patient: PatientPublic # Assuming PatientPublic is defined and imported
    # doctor: DoctorPublic   # Assuming DoctorPublic is defined and imported
    # appointment: AppointmentPublic # Assuming AppointmentPublic is defined and imported
