from sqlalchemy.orm import Session
import pytest

from app.crud import crud_schedule
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate
from tests.utils.user import create_random_doctor
from tests.utils.schedule import random_date, random_time


def test_create_schedule(db: Session) -> None:
    doctor = create_random_doctor(db)
    schedule_in = ScheduleCreate(doctor_id=doctor.doctor_id, date=random_date(), start=random_time(), end=random_time(), time_period="morning")
    schedule = crud_schedule.create_schedule(db, schedule_in=schedule_in)
    assert schedule.doctor_id == doctor.doctor_id
    assert schedule.date == schedule_in.date


def test_get_schedule(db: Session) -> None:
    doctor = create_random_doctor(db)
    schedule_in = ScheduleCreate(doctor_id=doctor.doctor_id, date=random_date(), start=random_time(), end=random_time(), time_period="morning")
    schedule = crud_schedule.create_schedule(db, schedule_in=schedule_in)
    stored_schedule = crud_schedule.get_schedule(db, schedule_id=schedule.schedule_id)
    assert stored_schedule
    assert schedule.schedule_id == stored_schedule.schedule_id
    assert schedule.date == stored_schedule.date


def test_update_schedule(db: Session) -> None:
    doctor = create_random_doctor(db)
    schedule_in = ScheduleCreate(doctor_id=doctor.doctor_id, date=random_date(), start=random_time(), end=random_time(), time_period="morning")
    schedule = crud_schedule.create_schedule(db, schedule_in=schedule_in)
    new_date = random_date()
    schedule_update_data = {"date": new_date}
    schedule_update = ScheduleUpdate(**schedule_update_data)
    updated_schedule = crud_schedule.update_schedule(
        db, schedule_id=schedule.schedule_id, schedule_in=schedule_update
    )
    assert updated_schedule.schedule_id == schedule.schedule_id
    assert updated_schedule.date == new_date


def test_delete_schedule(db: Session) -> None:
    doctor = create_random_doctor(db)
    schedule_in = ScheduleCreate(doctor_id=doctor.doctor_id, date=random_date(), start=random_time(), end=random_time(), time_period="morning")
    schedule = crud_schedule.create_schedule(db, schedule_in=schedule_in)
    deleted_schedule = crud_schedule.delete_schedule(db, schedule_id=schedule.schedule_id)
    assert deleted_schedule
    assert deleted_schedule.schedule_id == schedule.schedule_id
    schedule_after_delete = crud_schedule.get_schedule(db, schedule_id=schedule.schedule_id)
    assert schedule_after_delete is None
