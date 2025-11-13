from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
import uuid

class LeaveRequestBase(BaseModel):
    schedule_id: uuid.UUID
    doctor_id: uuid.UUID
    reason: str = Field(..., min_length=3, max_length=500)

class LeaveRequestCreate(LeaveRequestBase):
    pass

class LeaveRequestPublic(LeaveRequestBase):
    model_config = ConfigDict(from_attributes=True)

    leave_request_id: uuid.UUID
    requested_at: datetime
