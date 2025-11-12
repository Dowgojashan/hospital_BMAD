from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import date, datetime, timedelta # Import timedelta
import calendar
from fastapi import HTTPException, status # Import HTTPException and status

from app.models.schedule import Schedule
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


def create_schedule(db: Session, schedule_in: ScheduleCreate) -> Schedule:
    # Validate date is not in the past
    if schedule_in.date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="日期不能是過去的日期。"
        )

    # Check for overlapping schedules for the same doctor on the same date and time_period
    overlapping_schedule = db.query(Schedule).filter(
        Schedule.doctor_id == schedule_in.doctor_id,
        Schedule.date == schedule_in.date,
        Schedule.time_period == schedule_in.time_period
    ).first()

    if overlapping_schedule:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"該醫師在 {schedule_in.date} 的 {schedule_in.time_period} 時段已有班表重疊。"
        )

    db_schedule = Schedule(
        doctor_id=schedule_in.doctor_id,
        date=schedule_in.date,
        time_period=schedule_in.time_period, # Use time_period
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule


def update_schedule(db: Session, schedule_id: uuid.UUID, schedule_in: ScheduleUpdate, new_date: Optional[date] = None) -> Optional[Schedule]:
    db_schedule = db.query(Schedule).filter(Schedule.schedule_id == schedule_id).first()
    if not db_schedule:
        return None

    update_data = schedule_in.dict(exclude_unset=True)

    # Apply updates for non-date fields
    for field, value in update_data.items():
        setattr(db_schedule, field, value)

    # Explicitly handle date update
    if new_date:
        db_schedule.date = new_date

    # Validate date is not in the past (if date is updated)
    if db_schedule.date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="日期不能是過去的日期。"
        )

    # Check for overlapping schedules for the same doctor on the same date and time_period, excluding the current schedule
    overlapping_schedule = db.query(Schedule).filter(
        Schedule.doctor_id == db_schedule.doctor_id,
        Schedule.date == db_schedule.date,
        Schedule.time_period == db_schedule.time_period, # Use time_period
        Schedule.schedule_id != schedule_id # Exclude current schedule
    ).first()

    if overlapping_schedule:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"該醫師在 {db_schedule.date} 的 {db_schedule.time_period} 時段已有班表重疊。"
        )

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


def create_recurring_schedules(db: Session, schedule_in: ScheduleRecurringCreate, recurring_group_id: Optional[uuid.UUID] = None) -> List[Schedule]:
    schedules_to_create = []
    if not recurring_group_id:
        recurring_group_id = uuid.uuid4()

    # Calculate end date
    end_year = schedule_in.start_date.year + (schedule_in.start_date.month + schedule_in.months_to_create - 1) // 12
    end_month = (schedule_in.start_date.month + schedule_in.months_to_create - 1) % 12 + 1
    end_day = calendar.monthrange(end_year, end_month)[1]
    end_date = date(end_year, end_month, end_day)

    current_date = schedule_in.start_date
    while current_date <= end_date:
        if current_date.weekday() == schedule_in.day_of_week:
            # Check for overlapping schedules
            overlapping_schedule = db.query(Schedule).filter(
                Schedule.doctor_id == schedule_in.doctor_id,
                Schedule.date == current_date,
                Schedule.time_period == schedule_in.time_period
            ).first()

            if overlapping_schedule:
                # In a batch operation, we might choose to skip conflicts or raise an error.
                # Raising an error for the first conflict is safer.
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"該醫師在 {current_date} 的 {schedule_in.time_period} 時段已有班表重疊，批次新增已中止。"
                )

            new_schedule = Schedule(
                doctor_id=schedule_in.doctor_id,
                date=current_date,
                time_period=schedule_in.time_period,
                recurring_group_id=recurring_group_id
            )
            schedules_to_create.append(new_schedule)
        
        current_date += timedelta(days=1)

    if not schedules_to_create:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="在指定的期間內，找不到符合條件的日期可供排班。"
        )

    db.add_all(schedules_to_create)
    db.commit()
    
    # We need to return the created objects with their IDs, so we refresh them
    # A bit inefficient, but necessary to return the full objects.
    # A direct query after commit is another option.
    for schedule in schedules_to_create:
        db.refresh(schedule)

    return schedules_to_create


def delete_recurring_schedules(db: Session, recurring_group_id: uuid.UUID, start_date: date) -> int:
    """
    Deletes all schedules in a recurring group on or after a given start_date.
    Returns the number of deleted schedules.
    """
    schedules_to_delete = db.query(Schedule).filter(
        Schedule.recurring_group_id == recurring_group_id,
        Schedule.date >= start_date
    )
    
    deleted_count = schedules_to_delete.count()

    if deleted_count > 0:
        schedules_to_delete.delete(synchronize_session=False)
        db.commit()

    return deleted_count


def update_recurring_schedules(db: Session, recurring_group_id: uuid.UUID, schedule_in: ScheduleRecurringCreate) -> List[Schedule]:
    """
    Updates a recurring schedule by deleting future instances and creating new ones.
    """
    # First, delete all future instances from the start date of the change
    delete_recurring_schedules(db=db, recurring_group_id=recurring_group_id, start_date=schedule_in.start_date)

    # Then, create new recurring schedules from the start date with the new settings,
    # reusing the original recurring_group_id.
    new_schedules = create_recurring_schedules(db=db, schedule_in=schedule_in, recurring_group_id=recurring_group_id)

    return new_schedules
