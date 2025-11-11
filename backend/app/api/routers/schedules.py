from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import date

from app.db.session import get_db
from app.models.admin import Admin
from app.crud import crud_schedule
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate, SchedulePublic
from app.api.routers.admin_management import get_current_active_admin

router = APIRouter()


@router.post("/", response_model=SchedulePublic, status_code=status.HTTP_201_CREATED)
def create_schedule_endpoint(
    schedule_in: ScheduleCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    """
    Create a new schedule. Only accessible by administrators.
    """
    return crud_schedule.create_schedule(db=db, schedule_in=schedule_in)


@router.get("/", response_model=List[SchedulePublic])
def list_schedules_endpoint(
    doctor_id: Optional[uuid.UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    """
    List schedules. Only accessible by administrators.
    Allows filtering by doctor_id and date range.
    """
    return crud_schedule.list_schedules(
        db=db, doctor_id=doctor_id, start_date=start_date, end_date=end_date, skip=skip, limit=limit
    )


@router.get("/{schedule_id}", response_model=SchedulePublic)
def get_schedule_endpoint(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    """
    Get a specific schedule by ID. Only accessible by administrators.
    """
    db_schedule = crud_schedule.get_schedule(db=db, schedule_id=schedule_id)
    if not db_schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return db_schedule


@router.put("/{schedule_id}", response_model=SchedulePublic)
def update_schedule_endpoint(
    schedule_id: uuid.UUID,
    schedule_in: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    """
    Update a schedule. Only accessible by administrators.
    """
    db_schedule = crud_schedule.update_schedule(db=db, schedule_id=schedule_id, schedule_in=schedule_in)
    if not db_schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return db_schedule


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule_endpoint(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    """
    Delete a schedule. Only accessible by administrators.
    """
    db_schedule = crud_schedule.delete_schedule(db=db, schedule_id=schedule_id)
    if not db_schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return
