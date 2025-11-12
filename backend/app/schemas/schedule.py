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


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    doctor_id: Optional[uuid.UUID] = None
    time_period: Optional[TIME_PERIOD_ENUM] = None # Use the Literal type for validation
    recurring_group_id: Optional[uuid.UUID] = None



class SchedulePublic(ScheduleBase):
    model_config = ConfigDict(from_attributes=True)

    schedule_id: uuid.UUID
    recurring_group_id: Optional[uuid.UUID] = None
    created_at: datetime


class ScheduleRecurringCreate(BaseModel):
    doctor_id: uuid.UUID
    time_period: TIME_PERIOD_ENUM
    start_date: date
    day_of_week: int = Field(..., ge=0, le=6) # 0=Monday, 6=Sunday
    months_to_create: int = Field(..., ge=1, le=3)
