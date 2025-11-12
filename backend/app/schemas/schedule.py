from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import date, datetime
import uuid
from typing import Optional, Literal # Import Literal

# Define the allowed time periods
TIME_PERIOD_ENUM = Literal["morning", "afternoon", "night"]

class ScheduleBase(BaseModel):
    doctor_id: uuid.UUID
    date: date
    time_period: TIME_PERIOD_ENUM # Use the Literal type for validation
    max_patients: int = Field(..., ge=1) # New field for max patients


class ScheduleCreate(ScheduleBase):
    max_patients: int = Field(10, ge=1) # Default to 10 if not provided


class ScheduleUpdate(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True) # Add this line
    doctor_id: Optional[uuid.UUID] = None
    date: Optional[date] = Field(default=None) # Explicitly define with Field(default=None)
    time_period: Optional[TIME_PERIOD_ENUM] = None # Use the Literal type for validation
    recurring_group_id: Optional[uuid.UUID] = None
    max_patients: Optional[int] = Field(default=None, ge=1) # New field for max patients


class SchedulePublic(ScheduleBase):
    model_config = ConfigDict(from_attributes=True)

    schedule_id: uuid.UUID
    recurring_group_id: Optional[uuid.UUID] = None
    booked_patients: int # New field for booked patients
    created_at: datetime

class ScheduleDoctorPublic(SchedulePublic):
    doctor_name: str
    specialty: str


class ScheduleRecurringCreate(BaseModel):
    doctor_id: uuid.UUID
    time_period: TIME_PERIOD_ENUM
    start_date: date
    day_of_week: int = Field(..., ge=0, le=6) # 0=Monday, 6=Sunday
    months_to_create: int = Field(..., ge=1, le=3)
    max_patients: int = Field(10, ge=1) # New field for max patients
