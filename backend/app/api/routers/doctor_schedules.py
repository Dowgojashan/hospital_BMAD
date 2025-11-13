from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import uuid

from app.db.session import get_db
from app.models.doctor import Doctor
from app.crud import crud_schedule
from app.schemas.schedule import SchedulePublic, ScheduleDoctorPublic, LeaveRequestCreate, LeaveRequestRangeCreate # Import ScheduleDoctorPublic and LeaveRequestCreate
from app.api.dependencies import get_current_active_doctor # Import the new dependency
from app.services.schedule_service import schedule_service # Import schedule_service

router = APIRouter()

@router.get("/me/schedules", response_model=List[ScheduleDoctorPublic]) # Use ScheduleDoctorPublic
def list_my_schedules(
    month: Optional[int] = Query(None, description="Filter schedules by month (1-12)"),
    year: Optional[int] = Query(None, description="Filter schedules by year"),
    time_period: Optional[str] = Query(None, description="Filter schedules by time period (e.g., morning, afternoon, night)"),
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor),
):
    """
    Retrieve schedules for the currently authenticated doctor.
    """
    return crud_schedule.get_doctor_schedules(
        db=db,
        doctor_id=current_doctor.doctor_id,
        month=month,
        year=year,
        time_period=time_period,
    )

@router.post("/me/leave-requests", response_model=SchedulePublic, status_code=status.HTTP_201_CREATED)
def submit_leave_request(
    leave_request_in: LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor),
):
    """
    Allow a doctor to submit a leave request for a specific date and time period.
    This will mark the schedule slot as unavailable (max_patients = 0).
    """
    try:
        updated_schedule = schedule_service.request_doctor_leave(
            db,
            doctor_id=current_doctor.doctor_id,
            leave_request_in=leave_request_in
        )
        return updated_schedule
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit leave request: {e}"
        )

@router.post("/me/leave-requests/range", response_model=List[SchedulePublic], status_code=status.HTTP_201_CREATED)
def submit_leave_request_range(
    leave_request_in: LeaveRequestRangeCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor),
):
    """
    Allow a doctor to submit a leave request for a date range and multiple time periods.
    This will mark all matching schedule slots as unavailable (max_patients = 0).
    """
    try:
        updated_schedules = schedule_service.request_doctor_leave_range(
            db,
            doctor_id=current_doctor.doctor_id,
            leave_request_in=leave_request_in
        )
        return updated_schedules
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit leave request for range: {e}"
        )
