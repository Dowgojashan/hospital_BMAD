from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import date

from app.db.session import get_db
from app.crud import crud_schedule, crud_doctor # Import crud_doctor
from app.schemas.schedule import ScheduleDoctorPublic
from app.schemas.doctor import DoctorPublic # Import DoctorPublic

router = APIRouter()

@router.get("/schedules", response_model=List[ScheduleDoctorPublic])
def list_available_schedules_for_patients(
    specialty: Optional[str] = Query(None, description="Filter schedules by doctor specialty"),
    doctor_id: Optional[uuid.UUID] = Query(None, description="Filter schedules by specific doctor ID"),
    month: Optional[int] = Query(None, description="Filter schedules by month (1-12)"),
    year: Optional[int] = Query(None, description="Filter schedules by year"),
    time_period: Optional[str] = Query(None, description="Filter schedules by time period (e.g., morning, afternoon, night)"),
    db: Session = Depends(get_db),
):
    """
    Retrieve available schedules for patients, with optional filters for specialty, doctor, month, year, and time period.
    This endpoint does not require authentication.
    """
    return crud_schedule.list_public_schedules(
        db=db,
        specialty=specialty,
        doctor_id=doctor_id,
        month=month,
        year=year,
        time_period=time_period,
    )

@router.get("/doctors", response_model=List[DoctorPublic])
def list_public_doctors(
    specialty: Optional[str] = Query(None, description="Filter doctors by specialty"),
    db: Session = Depends(get_db),
):
    """
    Retrieve a list of doctors, optionally filtered by specialty.
    This endpoint does not require authentication.
    """
    return crud_doctor.list_doctors(db=db, specialty=specialty)