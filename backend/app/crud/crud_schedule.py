from sqlalchemy.orm import Session
from sqlalchemy.sql import func, case # Import func and case
from typing import List, Optional
import uuid
from datetime import date, datetime, timedelta
import calendar
from fastapi import HTTPException, status
import os # Import os

from app.models.schedule import Schedule
from app.models.doctor import Doctor
from app.models.leave_request import LeaveRequest # Import LeaveRequest
from app.schemas.schedule import (
    ScheduleCreate,
    ScheduleUpdate,
    ScheduleRecurringCreate,
    ScheduleRecurringUpdate,
)


def create_schedule(db: Session, schedule_in: ScheduleCreate) -> Schedule:
    # # Explicitly prevent creating schedules for past dates, unless testing is enabled
    # if schedule_in.date < date.today() and os.getenv("ALLOW_SAME_DAY_OPERATIONS_FOR_TESTING", "false").lower() != "true":
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="不允許新增過去的班表"
    #     )

    # # Prevent creating schedules for the current day, unless testing is enabled
    # if schedule_in.date == date.today() and os.getenv("ALLOW_SAME_DAY_OPERATIONS_FOR_TESTING", "false").lower() != "true":
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="不允許新增當天的班表"
    #     )

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
            detail="該醫師在指定日期和時段已有班表，請勿重複新增。",
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
            detail="該醫師在指定日期和時段已有班表，請勿重複新增。",
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


def list_schedules(db: Session, doctor_ids: Optional[List[uuid.UUID]] = None, date_str: Optional[str] = None, month: Optional[int] = None, year: Optional[int] = None, time_period: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Schedule]:
    query = db.query(Schedule)
    if doctor_ids:
        query = query.filter(Schedule.doctor_id.in_(doctor_ids))
    
    if date_str:
        try:
            filter_date = date.fromisoformat(date_str)
            query = query.filter(Schedule.date == filter_date)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format. Use YYYY-MM-DD.")
    elif month and year:
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


def get_doctor_schedules(db: Session, doctor_id: uuid.UUID, date_str: Optional[str] = None, month: Optional[int] = None, year: Optional[int] = None, time_period: Optional[str] = None) -> List[dict]:
    query = db.query(Schedule, Doctor).join(Doctor, Schedule.doctor_id == Doctor.doctor_id).filter(Schedule.doctor_id == doctor_id)

    if date_str:
        try:
            filter_date = date.fromisoformat(date_str)
            query = query.filter(Schedule.date == filter_date)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format. Use YYYY-MM-DD.")
    elif month and year:
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
    
    # Add order by time_period
    query = query.order_by(
        case(
            (Schedule.time_period == "morning", 1),
            (Schedule.time_period == "afternoon", 2),
            (Schedule.time_period == "night", 3),
            else_=4 # Default for any other unexpected values
        )
    )

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


def _add_months(source_date, months):
    month = source_date.month - 1 + months
    year = source_date.year + month // 12
    month = month % 12 + 1
    day = min(source_date.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)

def create_recurring_schedules(db: Session, schedule_in: ScheduleRecurringCreate) -> List[Schedule]:
    recurring_group_id = uuid.uuid4()
    created_schedules = []
    
    # Calculate the end date based on the number of months
    end_date = _add_months(schedule_in.start_date, schedule_in.months_to_create)
    
    current_date = schedule_in.start_date
    while current_date < end_date:
        # Check if the current day matches the recurring day of the week
        if current_date.weekday() == schedule_in.day_of_week:
            # Check for existing schedule for the same doctor, date, and time_period
            existing_schedule = (
                db.query(Schedule)
                .filter(
                    Schedule.doctor_id == schedule_in.doctor_id,
                    Schedule.date == current_date,
                    Schedule.time_period == schedule_in.time_period,
                )
                .first()
            )
            if existing_schedule:
                # Instead of raising an error, we could skip or log this.
                # For now, we'll raise to notify the user of the conflict.
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="該醫師在指定日期和時段已有班表，請勿重複新增。",
                )

            db_schedule = Schedule(
                doctor_id=schedule_in.doctor_id,
                date=current_date,
                time_period=schedule_in.time_period,
                max_patients=schedule_in.max_patients,
                booked_patients=0,
                recurring_group_id=recurring_group_id,
            )
            db.add(db_schedule)
            created_schedules.append(db_schedule)
        
        current_date += timedelta(days=1)

    db.commit()
    for schedule in created_schedules:
        db.refresh(schedule)
    return created_schedules


def recreate_recurring_schedules(
    db: Session, recurring_group_id: uuid.UUID, schedule_in: ScheduleRecurringCreate
) -> List[Schedule]:
    # This function is for changing the entire pattern, so it deletes and recreates.
    db.query(Schedule).filter(
        Schedule.recurring_group_id == recurring_group_id,
    ).delete(synchronize_session=False)
    db.commit()
    
    # Re-use the creation logic but with the existing recurring_group_id
    created_schedules = []
    end_date = _add_months(schedule_in.start_date, schedule_in.months_to_create)
    current_date = schedule_in.start_date
    while current_date < end_date:
        if current_date.weekday() == schedule_in.day_of_week:
            # Check for existing schedule for the same doctor, date, and time_period
            existing_schedule = (
                db.query(Schedule)
                .filter(
                    Schedule.doctor_id == schedule_in.doctor_id,
                    Schedule.date == current_date,
                    Schedule.time_period == schedule_in.time_period,
                )
                .first()
            )
            if existing_schedule:
                # Instead of raising an error, we could skip or log this.
                # For now, we'll raise to notify the user of the conflict.
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="該醫師在指定日期和時段已有班表，請勿重複新增。",
                )

            db_schedule = Schedule(
                doctor_id=schedule_in.doctor_id,
                date=current_date,
                time_period=schedule_in.time_period,
                max_patients=schedule_in.max_patients,
                booked_patients=0,
                recurring_group_id=recurring_group_id,
            )
            db.add(db_schedule)
            created_schedules.append(db_schedule)
        current_date += timedelta(days=1)

    db.commit()
    for schedule in created_schedules:
        db.refresh(schedule)
    return created_schedules

def update_recurring_schedules(
    db: Session, recurring_group_id: uuid.UUID, schedule_in: ScheduleRecurringUpdate
) -> List[Schedule]:
    # This function updates properties of all schedules in a group without changing dates.
    schedules_to_update = db.query(Schedule).filter(
        Schedule.recurring_group_id == recurring_group_id
    ).all()

    if not schedules_to_update:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No schedules found for this recurring group ID.",
        )

    for schedule in schedules_to_update:
        schedule.time_period = schedule_in.time_period
        schedule.max_patients = schedule_in.max_patients
        db.add(schedule)

    db.commit()
    for schedule in schedules_to_update:
        db.refresh(schedule)
        
    return schedules_to_update



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


def list_pending_leave_requests(db: Session, department: Optional[str] = None) -> List[dict]:
    """
    Lists all schedule entries that are pending leave approval, including the leave reason.
    Can be filtered by department.
    """
    query = (
        db.query(Schedule, Doctor, LeaveRequest)
        .join(Doctor, Schedule.doctor_id == Doctor.doctor_id)
        .outerjoin(LeaveRequest, Schedule.schedule_id == LeaveRequest.schedule_id)
        .filter(Schedule.status == "leave_pending")
    )

    if department:
        query = query.filter(Doctor.specialty == department)

    query = query.order_by(Schedule.date.asc())

    results = []
    for schedule_obj, doctor_obj, leave_request_obj in query.all():
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
            "leave_reason": leave_request_obj.reason if leave_request_obj else None, # Include the reason
        }
        results.append(schedule_data)
    return results


def update_schedule_status(db: Session, schedule_id: uuid.UUID, new_status: str) -> Optional[dict]:
    """
    Updates the status of a schedule and returns the enriched object.
    """
    schedule_obj = db.query(Schedule).filter(Schedule.schedule_id == schedule_id).first()
    if not schedule_obj:
        return None

    schedule_obj.status = new_status
    if new_status == 'available':
        # Restore max_patients to a default value, assuming 10
        schedule_obj.max_patients = 10
    elif new_status == 'leave_approved':
        schedule_obj.max_patients = 0

    db.commit()
    db.refresh(schedule_obj)

    # Fetch doctor info to build the full response object
    doctor_obj = db.query(Doctor).filter(Doctor.doctor_id == schedule_obj.doctor_id).first()
    if not doctor_obj:
        # This should ideally not happen if data integrity is maintained
        return None

    return {
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
