from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from uuid import UUID

class InfractionBase(BaseModel):
    patient_id: UUID
    appointment_id: Optional[UUID] = None
    infraction_type: str = Field(..., description="Type of infraction, e.g., 'no_show', 'late_cancel'.")
    notes: Optional[str] = None

class InfractionCreate(InfractionBase):
    pass

class InfractionUpdate(InfractionBase):
    penalty_applied: Optional[bool] = None
    penalty_until: Optional[date] = None

class InfractionInDB(InfractionBase):
    infraction_id: UUID
    occurred_at: datetime
    penalty_applied: bool
    penalty_until: Optional[date]

    class Config:
        from_attributes = True
