# backend/app/schemas/appointment.py
import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

# Shared properties
class AppointmentBase(BaseModel):
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    date: date
    time_period: str = Field(..., pattern="^(morning|afternoon|night)$")
    status: str = Field("scheduled", pattern="^(scheduled|confirmed|waitlist|cancelled|checked_in|waiting|called|in_consult|completed|no_show)$")

# Properties to receive via API on creation
class AppointmentCreate(BaseModel):
    doctor_id: uuid.UUID
    date: date
    time_period: str = Field(..., pattern="^(morning|afternoon|night)$")

# Properties to receive via API on update
class AppointmentUpdate(BaseModel):
    date: Optional[date] = None
    time_period: Optional[str] = Field(None, pattern="^(morning|afternoon|night)$")
    status: Optional[str] = Field(None, pattern="^(scheduled|confirmed|waitlist|cancelled|checked_in|waiting|called|in_consult|completed|no_show)$")

# Properties to return via API
class AppointmentInDB(AppointmentBase):
    model_config = ConfigDict(from_attributes=True)

    appointment_id: uuid.UUID
    created_at: datetime

# Additional properties to return via API (e.g., for patient/doctor view)
class AppointmentPublic(AppointmentInDB):
    doctor_name: str
    specialty: str
    patient_name: str
