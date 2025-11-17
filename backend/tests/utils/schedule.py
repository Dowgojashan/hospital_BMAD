import random
from datetime import date, time, timedelta
import uuid

from sqlalchemy.orm import Session

from app.models.doctor import Doctor
from app.schemas.schedule import ScheduleCreate
from app.crud import crud_schedule


def random_date() -> date:
    return date.today() + timedelta(days=random.randint(1, 30))

def random_time() -> time:
    return time(hour=random.randint(9, 17), minute=random.choice([0, 30]))

def create_random_schedule(db: Session, doctor_id: uuid.UUID) -> crud_schedule.Schedule:
    schedule_in = ScheduleCreate(
        doctor_id=doctor_id,
        date=random_date(),
        time_period="morning" # Use time_period instead of start and end
    )
    return crud_schedule.create_schedule(db=db, schedule_in=schedule_in)
