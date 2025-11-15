import uuid
from datetime import date
from pydantic import BaseModel, Field

class RoomDayBase(BaseModel):
    schedule_id: uuid.UUID
    next_sequence: int = Field(default=1)
    current_called_sequence: int | None = None

class RoomDayCreate(RoomDayBase):
    pass

class RoomDayUpdate(RoomDayBase):
    next_sequence: int | None = None
    current_called_sequence: int | None = None

class RoomDayInDBBase(RoomDayBase):
    room_day_id: uuid.UUID

    class Config:
        from_attributes = True

class RoomDay(RoomDayInDBBase):
    pass