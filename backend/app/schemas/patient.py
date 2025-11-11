import logging
import re
from pydantic import BaseModel, EmailStr, field_validator, Field, ConfigDict
from datetime import date, datetime
import uuid

logger = logging.getLogger(__name__)


class PatientCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    password: str = Field(..., min_length=6)
    dob: date
    phone: str
    email: EmailStr
    card_number: str

    @field_validator('phone')
    def validate_phone(cls, v):
        if not re.match(r'^09\d{8}$', v):
            raise ValueError('Phone number must be in the format 09xxxxxxxx')
        return v


class PatientPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    patient_id: uuid.UUID
    name: str
    dob: date
    phone: str
    email: EmailStr
    card_number: str
    created_at: datetime