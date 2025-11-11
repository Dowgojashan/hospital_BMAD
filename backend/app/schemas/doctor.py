from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
import uuid


class DoctorCreate(BaseModel):
    doctor_login_id: str
    password: str = Field(..., min_length=6)
    name: str
    specialty: str


class DoctorUpdate(BaseModel):
    password: Optional[str] = Field(None, min_length=6)
    name: Optional[str] = None
    specialty: Optional[str] = None


class DoctorPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    doctor_id: uuid.UUID
    doctor_login_id: str
    name: str
    specialty: str
    created_at: datetime
