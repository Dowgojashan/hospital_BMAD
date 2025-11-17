from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
import uuid


class AdminCreate(BaseModel):
    account_username: str
    password: str = Field(..., min_length=6)
    name: str
    email: EmailStr
    is_system_account: bool = False
    department: Optional[str] = None


class AdminUpdate(BaseModel):
    password: Optional[str] = Field(None, min_length=6)
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_system_account: Optional[bool] = None
    department: Optional[str] = None


class AdminPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    admin_id: uuid.UUID
    account_username: str
    name: str
    email: EmailStr
    is_system_admin: bool
    department: Optional[str] = None
    created_at: datetime
