from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import date, datetime
import uuid

# --- Update Schemas ---
class PatientProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    dob: Optional[date] = None
    card_number: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)

class DoctorProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    # specialty is not updatable via profile page
    password: Optional[str] = Field(None, min_length=6)

class AdminProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)

# --- Response Schemas ---
# These are similar to Public schemas but might be tailored for the profile view
class PatientProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    patient_id: uuid.UUID
    name: str
    email: EmailStr
    phone: Optional[str] = None
    dob: Optional[date] = None
    card_number: Optional[str] = None
    created_at: datetime

class DoctorProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    doctor_id: uuid.UUID
    doctor_login_id: str
    name: str
    specialty: str
    email: EmailStr
    created_at: datetime

class AdminProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    admin_id: uuid.UUID
    account_username: str
    name: str
    email: EmailStr
    is_system_admin: bool
    created_at: datetime
