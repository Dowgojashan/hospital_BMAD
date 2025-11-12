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
    date: Optional[date] = None
    time_period: Optional[TIME_PERIOD_ENUM] = None # Use the Literal type for validation


class SchedulePublic(ScheduleBase):
    model_config = ConfigDict(from_attributes=True)

    schedule_id: uuid.UUID
    created_at: datetime
