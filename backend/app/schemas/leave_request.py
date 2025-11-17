from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, date # Import date
import uuid
from typing import List, Optional # Import List and Optional

class LeaveRequestBase(BaseModel):
    schedule_id: Optional[uuid.UUID] = None # Make optional for range requests
    doctor_id: Optional[uuid.UUID] = None # Make optional for range requests
    reason: str = Field(..., min_length=3, max_length=500)
    date: Optional[date] = None # Add date field for single requests

class LeaveRequestCreate(LeaveRequestBase):
    schedule_id: uuid.UUID # Required for single leave
    date: date # Required for single leave
    time_period: str # Required for single leave

class LeaveRequestRangeCreate(BaseModel):
    start_date: date
    end_date: date
    time_periods: List[str] # e.g., ["morning", "afternoon", "night"]
    reason: str = Field(..., min_length=3, max_length=500)

class LeaveRequestPublic(LeaveRequestBase):
    model_config = ConfigDict(from_attributes=True)

    leave_request_id: uuid.UUID
    requested_at: datetime
    schedule_id: uuid.UUID # Ensure it's not optional in public model
    doctor_id: uuid.UUID # Ensure it's not optional in public model
    date: date # Ensure it's not optional in public model
    time_period: Optional[str] = None # Optional for range requests, but present if single
