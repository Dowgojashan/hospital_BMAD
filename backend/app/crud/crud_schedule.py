from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Optional
import uuid
from datetime import date, datetime, timedelta # Import timedelta
import calendar
from fastapi import HTTPException, status # Import HTTPException and status

from app.models.schedule import Schedule
from app.models.doctor import Doctor # Import Doctor model
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleRecurringCreate


def get_schedule(db: Session, schedule_id: uuid.UUID) -> Optional[Schedule]:
    return db.query(Schedule).filter(Schedule.schedule_id == schedule_id).first()


def list_schedules(db: Session, doctor_ids: Optional[List[uuid.UUID]] = None, month: Optional[int] = None, year: Optional[int] = None, time_period: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Schedule]:
    query = db.query(Schedule)
    if doctor_ids:
        query = query.filter(Schedule.doctor_id.in_(doctor_ids))
    if month and year:
        # Construct date range for the given month and year
        start_date = date(year, month, 1)
        # Calculate the last day of the month
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        query = query.filter(Schedule.date >= start_date, Schedule.date <= end_date)
    elif month: # If only month is provided, filter for current year
        current_year = date.today().year
        start_date = date(current_year, month, 1)
        if month == 12:
            end_date = date(current_year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(current_year, month + 1, 1) - timedelta(days=1)
        query = query.filter(Schedule.date >= start_date, Schedule.date <= end_date)
    elif year: # If only year is provided, filter for the entire year
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)
        query = query.filter(Schedule.date >= start_date, Schedule.date <= end_date)

    if time_period:
        query = query.filter(Schedule.time_period == time_period)
    return query.offset(skip).limit(limit).all()


def get_doctor_schedules(db: Session, doctor_id: uuid.UUID, month: Optional[int] = None, year: Optional[int] = None, time_period: Optional[str] = None) -> List[dict]:
    query = db.query(Schedule, Doctor).join(Doctor, Schedule.doctor_id == Doctor.doctor_id).filter(Schedule.doctor_id == doctor_id)

    if month and year:
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        query = query.filter(Schedule.date >= start_date, Schedule.date <= end_date)
    elif month:
        current_year = date.today().year
        start_date = date(current_year, month, 1)
        if month == 12:
            end_date = date(current_year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(current_year, month + 1, 1) - timedelta(days=1)
        query = query.filter(Schedule.date >= start_date, Schedule.date <= end_date)
    elif year:
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)
        query = query.filter(Schedule.date >= start_date, Schedule.date <= end_date)

    if time_period:
        query = query.filter(Schedule.time_period == time_period)
    
    results = []
    for schedule_obj, doctor_obj in query.all():
        # Construct a dictionary that contains all fields for ScheduleDoctorPublic
        schedule_data = {
            "schedule_id": schedule_obj.schedule_id,
            "doctor_id": schedule_obj.doctor_id,
            "date": schedule_obj.date,
            "time_period": schedule_obj.time_period,
            "recurring_group_id": schedule_obj.recurring_group_id,
            "created_at": schedule_obj.created_at,
            "doctor_name": doctor_obj.name,
            "specialty": doctor_obj.specialty,
        }
        results.append(schedule_data)
    return results



