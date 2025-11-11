from pydantic import BaseModel, ConfigDict
from datetime import date, time, datetime
import uuid
from typing import Optional


class ScheduleBase(BaseModel):
    doctor_id: uuid.UUID
    date: date
    start: time
    end: time


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    doctor_id: Optional[uuid.UUID] = None
    date: Optional[date] = None
    start: Optional[time] = None
    end: Optional[time] = None


class SchedulePublic(ScheduleBase):
    model_config = ConfigDict(from_attributes=True)

    schedule_id: uuid.UUID
    created_at: datetime
