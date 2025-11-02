import logging
import re
from pydantic import BaseModel, EmailStr, validator, Field
from datetime import date, datetime
import uuid

logger = logging.getLogger(__name__)


class PatientCreate(BaseModel):
    name: str
    password: str = Field(..., min_length=6)
    dob: date
    phone: str
    email: EmailStr
    card_number: str

    @validator('phone')
    def validate_phone(cls, v):
        if not re.match(r'^09\d{8}$', v):
            raise ValueError('Phone number must be in the format 09xxxxxxxx')
        return v

    class Config:
        orm_mode = True


class PatientPublic(BaseModel):
    patient_id: uuid.UUID
    name: str
    dob: date
    phone: str
    email: EmailStr
    card_number: str
    created_at: datetime

    class Config:
        orm_mode = True