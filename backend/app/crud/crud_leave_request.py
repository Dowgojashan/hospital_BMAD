from sqlalchemy.orm import Session
import uuid
from typing import Optional

from app.models.leave_request import LeaveRequest
from app.schemas.leave_request import LeaveRequestCreate

def create_leave_request(db: Session, leave_request_in: LeaveRequestCreate) -> LeaveRequest:
    db_leave_request = LeaveRequest(
        schedule_id=leave_request_in.schedule_id,
        doctor_id=leave_request_in.doctor_id,
        reason=leave_request_in.reason,
    )
    db.add(db_leave_request)
    # db.refresh(db_leave_request) # Removed: refresh should happen after commit in service layer
    return db_leave_request

def get_leave_request_by_schedule_id(db: Session, schedule_id: uuid.UUID) -> Optional[LeaveRequest]:
    return db.query(LeaveRequest).filter(LeaveRequest.schedule_id == schedule_id).first()
