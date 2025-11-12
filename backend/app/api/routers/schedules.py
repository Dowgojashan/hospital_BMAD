from fastapi import APIRouter, Depends, HTTPException, status, Query # Import Query
from sqlalchemy.orm import Session
from typing import List, Optional # Ensure List is imported
import uuid
from datetime import date
import logging # Import logging

from app.db.session import get_db
from app.models.admin import Admin
from app.crud import crud_schedule
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate, SchedulePublic
from app.api.routers.admin_management import get_current_active_admin

router = APIRouter()
logger = logging.getLogger(__name__) # Initialize logger


@router.post("/", response_model=SchedulePublic, status_code=status.HTTP_201_CREATED)
def create_schedule_endpoint(
    schedule_in: ScheduleCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    """
    Create a new schedule. Only accessible by administrators.
    """
    try:
        return crud_schedule.create_schedule(db=db, schedule_in=schedule_in)
    except HTTPException as e:
        logger.error(f"Error creating schedule: {e.detail}")
        raise e


@router.get("/", response_model=List[SchedulePublic])
def list_schedules_endpoint(
    doctor_ids: Optional[List[uuid.UUID]] = Query(None), # Changed to accept a list of doctor_ids
    month: Optional[int] = None, # New filter for month
    year: Optional[int] = None,  # New filter for year
    time_period: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    """
    List schedules. Only accessible by administrators.
    Allows filtering by doctor_ids, month, year, and time_period.
    """
    return crud_schedule.list_schedules(
        db=db, doctor_ids=doctor_ids, month=month, year=year, time_period=time_period, skip=skip, limit=limit
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
    try:
        db_schedule = crud_schedule.update_schedule(db=db, schedule_id=schedule_id, schedule_in=schedule_in)
        if not db_schedule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
        return db_schedule
    except HTTPException as e:
        logger.error(f"Error updating schedule {schedule_id}: {e.detail}")
        raise e


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
