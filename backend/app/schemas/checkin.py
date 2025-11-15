import uuid
from datetime import datetime
from pydantic import BaseModel, Field

class CheckinBase(BaseModel):
    appointment_id: uuid.UUID | None = None
    patient_id: uuid.UUID
    checkin_time: datetime | None = None
    checkin_method: str | None = None # "onsite", "online"
    ticket_sequence: int | None = None
    ticket_number: str | None = None
    cancelled_by: uuid.UUID | None = None
    cancel_reason: str | None = None

class CheckinCreate(CheckinBase):
    patient_id: uuid.UUID # patient_id is required for creation

class CheckinInDBBase(CheckinBase):
    checkin_id: uuid.UUID

    class Config:
        from_attributes = True

class Checkin(CheckinInDBBase):
    pass
