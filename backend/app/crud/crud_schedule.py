from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import date

from app.models.schedule import Schedule
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate


def get_schedule(db: Session, schedule_id: uuid.UUID) -> Optional[Schedule]:
    return db.query(Schedule).filter(Schedule.schedule_id == schedule_id).first()


def list_schedules(db: Session, doctor_id: Optional[uuid.UUID] = None, start_date: Optional[date] = None, end_date: Optional[date] = None, skip: int = 0, limit: int = 100) -> List[Schedule]:
    query = db.query(Schedule)
    if doctor_id:
        query = query.filter(Schedule.doctor_id == doctor_id)
    if start_date:
        query = query.filter(Schedule.date >= start_date)
    if end_date:
        query = query.filter(Schedule.date <= end_date)
    return query.offset(skip).limit(limit).all()


def create_schedule(db: Session, schedule_in: ScheduleCreate) -> Schedule:
    db_schedule = Schedule(
        doctor_id=schedule_in.doctor_id,
        date=schedule_in.date,
        start=schedule_in.start,
        end=schedule_in.end,
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule


def update_schedule(db: Session, schedule_id: uuid.UUID, schedule_in: ScheduleUpdate) -> Optional[Schedule]:
    db_schedule = db.query(Schedule).filter(Schedule.schedule_id == schedule_id).first()
    if not db_schedule:
        return None

    update_data = schedule_in.dict(exclude_unset=True)
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
