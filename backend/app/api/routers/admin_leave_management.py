from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from typing import List

from app.db.session import get_db
from app.crud import crud_schedule
from app.schemas.schedule import ScheduleDoctorPublic, AdminLeaveRequestPublic # Import AdminLeaveRequestPublic
from app.api.dependencies import get_current_active_admin

router = APIRouter()

@router.get("/leave-requests", response_model=List[AdminLeaveRequestPublic])
def get_pending_leave_requests(
    db: Session = Depends(get_db),
    current_admin: Session = Depends(get_current_active_admin),
):
    """
    Retrieve all pending leave requests for admin review.
    """
    return crud_schedule.list_pending_leave_requests(db)

@router.put("/leave-requests/{schedule_id}/approve", response_model=ScheduleDoctorPublic)
def approve_leave_request(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: Session = Depends(get_current_active_admin),
):
    """
    Approve a doctor's leave request.
    """
    schedule = crud_schedule.get_schedule(db, schedule_id=schedule_id)
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found.")
    if schedule.status != 'leave_pending':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This is not a pending leave request.")
    if schedule.booked_patients > 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot approve leave for a schedule with existing bookings.")

    updated_schedule = crud_schedule.update_schedule_status(db, schedule_id=schedule_id, new_status='leave_approved')
    if not updated_schedule:
        # This case should ideally not be hit if the above checks passed
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update schedule.")
    return updated_schedule

@router.put("/leave-requests/{schedule_id}/reject", response_model=ScheduleDoctorPublic)
def reject_leave_request(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: Session = Depends(get_current_active_admin),
):
    """
    Reject a doctor's leave request.
    """
    schedule = crud_schedule.get_schedule(db, schedule_id=schedule_id)
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found.")
    if schedule.status != 'leave_pending':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This is not a pending leave request.")

    updated_schedule = crud_schedule.update_schedule_status(db, schedule_id=schedule_id, new_status='available')
    if not updated_schedule:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update schedule.")
    return updated_schedule
