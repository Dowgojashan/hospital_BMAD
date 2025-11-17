from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, Field


class AuditLogBase(BaseModel):
    user_id: str
    action: str
    target_id: Optional[str] = None
    log_metadata: Optional[dict] = None


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogPublic(AuditLogBase):
    log_id: uuid.UUID
    timestamp: datetime
    user_name: Optional[str] = None # Add user_name
    target_type: Optional[str] = None # Add target_type

    class Config:
        from_attributes = True
