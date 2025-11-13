from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Optional
import uuid
from datetime import date, datetime, timedelta
import calendar
from fastapi import HTTPException, status

from app.models.schedule import Schedule
from app.models.doctor import Doctor
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleRecurringCreate


def create_schedule(db: Session, schedule_in: ScheduleCreate) -> Schedule:
    # Check for existing schedule for the same doctor, date, and time_period
    existing_schedule = (
        db.query(Schedule)
        .filter(
            Schedule.doctor_id == schedule_in.doctor_id,
            Schedule.date == schedule_in.date,
            Schedule.time_period == schedule_in.time_period,
        )
        .first()
    )
    if existing_schedule:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A schedule already exists for this doctor at the specified date and time period.",
        )

    db_schedule = Schedule(
        doctor_id=schedule_in.doctor_id,
        date=schedule_in.date,
        time_period=schedule_in.time_period,
        max_patients=schedule_in.max_patients,
        booked_patients=0,
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule


def get_schedule(db: Session, schedule_id: uuid.UUID) -> Optional[Schedule]:
    return db.query(Schedule).filter(Schedule.schedule_id == schedule_id).first()


def update_schedule(
    db: Session, schedule_id: uuid.UUID, schedule_in: ScheduleUpdate
) -> Optional[Schedule]:
    db_schedule = db.query(Schedule).filter(Schedule.schedule_id == schedule_id).first()
    if not db_schedule:
        return None
    
    update_data = schedule_in.model_dump(exclude_unset=True)

    # Check for existing schedule for the same doctor, date, and time_period, excluding the current schedule
    existing_schedule = (
        db.query(Schedule)
        .filter(
            Schedule.doctor_id == update_data.get("doctor_id", db_schedule.doctor_id),
            Schedule.date == update_data.get("date", db_schedule.date),
            Schedule.time_period == update_data.get("time_period", db_schedule.time_period),
            Schedule.schedule_id != schedule_id,  # Exclude the current schedule being updated
        )
        .first()
    )
    if existing_schedule:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A schedule already exists for this doctor at the specified date and time period.",
        )

    for field, value in update_data.items():
        setattr(db_schedule, field, value)
    
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    
    return db_schedule


def delete_schedule(db: Session, schedule_id: uuid.UUID) -> Optional[Schedule]:
    db_schedule = db.query(Schedule).filter(Schedule.schedule_id == schedule_id).first()
    if not db_schedule:
        return None
    db.delete(db_schedule)
    db.commit()
    return db_schedule


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
            "status": schedule_obj.status,
            "max_patients": schedule_obj.max_patients,
            "booked_patients": schedule_obj.booked_patients,
            "recurring_group_id": schedule_obj.recurring_group_id,
            "created_at": schedule_obj.created_at,
            "doctor_name": doctor_obj.name,
            "specialty": doctor_obj.specialty,
        }
        results.append(schedule_data)
    return results


def list_public_schedules(db: Session, specialty: Optional[str] = None, doctor_id: Optional[uuid.UUID] = None, month: Optional[int] = None, year: Optional[int] = None, time_period: Optional[str] = None) -> List[dict]:
    query = db.query(Schedule, Doctor).join(Doctor, Schedule.doctor_id == Doctor.doctor_id)

    if specialty:
        query = query.filter(Doctor.specialty == specialty)
    if doctor_id:
        query = query.filter(Schedule.doctor_id == doctor_id)

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
        schedule_data = {
            "schedule_id": schedule_obj.schedule_id,
            "doctor_id": schedule_obj.doctor_id,
            "date": schedule_obj.date,
            "time_period": schedule_obj.time_period,
            "status": schedule_obj.status,
            "max_patients": schedule_obj.max_patients,
            "booked_patients": schedule_obj.booked_patients,
            "recurring_group_id": schedule_obj.recurring_group_id,
            "created_at": schedule_obj.created_at,
            "doctor_name": doctor_obj.name,
            "specialty": doctor_obj.specialty,
        }
        results.append(schedule_data)
    return results


def create_recurring_schedules(db: Session, schedule_in: ScheduleRecurringCreate) -> List[Schedule]:
    recurring_group_id = uuid.uuid4()
    created_schedules = []
    
    current_iteration_date = schedule_in.start_date

    for i in range(schedule_in.months_to_create):
        year = current_iteration_date.year
        month = current_iteration_date.month

        # Get the number of days in the current month
        num_days = calendar.monthrange(year, month)[1]

        for day in range(1, num_days + 1):
            temp_date = date(year, month, day)
            
            # Check if the day matches the recurring day of the week
            # and if it's on or after the start_date
            if temp_date.weekday() == schedule_in.day_of_week and temp_date >= schedule_in.start_date:
                # Check for existing schedule for the same doctor, date, and time_period
                existing_schedule = (
                    db.query(Schedule)
                    .filter(
                        Schedule.doctor_id == schedule_in.doctor_id,
                        Schedule.date == temp_date,
                        Schedule.time_period == schedule_in.time_period,
                    )
                    .first()
                )
                if existing_schedule:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"A schedule already exists for this doctor on {temp_date} at {schedule_in.time_period}.",
                    )

                db_schedule = Schedule(
                    doctor_id=schedule_in.doctor_id,
                    date=temp_date,
                    time_period=schedule_in.time_period,
                    max_patients=schedule_in.max_patients,
                    booked_patients=0,
                    recurring_group_id=recurring_group_id,
                )
                db.add(db_schedule)
                created_schedules.append(db_schedule)
        
        # Move to the first day of the next month for the next iteration
        if month == 12:
            current_iteration_date = date(year + 1, 1, 1)
        else:
            current_iteration_date = date(year, month + 1, 1)

    db.commit()
    for schedule in created_schedules:
        db.refresh(schedule)
    return created_schedules


def update_recurring_schedules(
    db: Session, recurring_group_id: uuid.UUID, schedule_in: ScheduleRecurringCreate
) -> List[Schedule]:
    # Delete ALL existing schedules for this recurring group
    db.query(Schedule).filter(
        Schedule.recurring_group_id == recurring_group_id,
    ).delete(synchronize_session=False)
    db.commit()

    # Create new schedules based on the updated pattern
    created_schedules = []
    current_iteration_date = schedule_in.start_date

    for i in range(schedule_in.months_to_create):
        year = current_iteration_date.year
        month = current_iteration_date.month

        num_days = calendar.monthrange(year, month)[1]

        for day in range(1, num_days + 1):
            temp_date = date(year, month, day)
            
            if temp_date.weekday() == schedule_in.day_of_week and temp_date >= schedule_in.start_date:
                # Check for existing schedule for the same doctor, date, and time_period
                # This check is crucial because we are recreating schedules.
                existing_schedule = (
                    db.query(Schedule)
                    .filter(
                        Schedule.doctor_id == schedule_in.doctor_id,
                        Schedule.date == temp_date,
                        Schedule.time_period == schedule_in.time_period,
                    )
                    .first()
                )
                if existing_schedule:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"A schedule already exists for this doctor on {temp_date} at {schedule_in.time_period}.",
                    )

                db_schedule = Schedule(
                    doctor_id=schedule_in.doctor_id,
                    date=temp_date,
                    time_period=schedule_in.time_period,
                    max_patients=schedule_in.max_patients,
                    booked_patients=0,
                    recurring_group_id=recurring_group_id, # Use the existing recurring_group_id
                )
                db.add(db_schedule)
                created_schedules.append(db_schedule)
        
        if month == 12:
            current_iteration_date = date(year + 1, 1, 1)
        else:
            current_iteration_date = date(year, month + 1, 1)

    db.commit()
    for schedule in created_schedules:
        db.refresh(schedule)
    return created_schedules


def delete_recurring_schedules(
    db: Session, recurring_group_id: uuid.UUID, start_date: date
) -> int:
    deleted_count = (
        db.query(Schedule)
        .filter(
            Schedule.recurring_group_id == recurring_group_id,
            Schedule.date >= start_date,
        )
        .delete(synchronize_session=False)
    )
    db.commit()
    return deleted_count



