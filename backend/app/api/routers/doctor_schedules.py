from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import uuid

from app.db.session import get_db
from app.models.doctor import Doctor
from app.crud import crud_schedule
from app.schemas.schedule import SchedulePublic, ScheduleDoctorPublic # Import ScheduleDoctorPublic
from app.api.dependencies import get_current_active_doctor # Import the new dependency

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
