from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import date
import logging

from app.db.session import get_db
from app.models.admin import Admin
from app.models.doctor import Doctor
from app.crud import crud_schedule, crud_doctor
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate, SchedulePublic, ScheduleRecurringCreate
from app.api.routers.admin_management import get_current_active_admin

router = APIRouter()
logger = logging.getLogger(__name__)

def _verify_doctor_department(db: Session, doctor_id: uuid.UUID, admin: Admin):
    """Helper to verify if a doctor belongs to the admin's department."""
    if admin.is_system_admin:
        return
    doctor = crud_doctor.get_doctor(db, doctor_id)
    if not doctor or doctor.specialty != admin.department:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="權限不足：您只能管理您所在科別的醫生班表"
        )

def _verify_schedule_department(db: Session, schedule_id: uuid.UUID, admin: Admin):
    """Helper to verify if a schedule belongs to the admin's department."""
    if admin.is_system_admin:
        return
    schedule = crud_schedule.get_schedule(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    
    _verify_doctor_department(db, schedule.doctor_id, admin)
    return schedule


@router.post("/", response_model=SchedulePublic, status_code=status.HTTP_201_CREATED)
def create_schedule_endpoint(
    schedule_in: ScheduleCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    _verify_doctor_department(db, schedule_in.doctor_id, current_admin)
    try:
        return crud_schedule.create_schedule(db=db, schedule_in=schedule_in)
    except HTTPException as e:
        logger.error(f"Error creating schedule: {e.detail}")
        raise e


@router.post("/recurring", response_model=List[SchedulePublic], status_code=status.HTTP_201_CREATED)
def create_recurring_schedules_endpoint(
    schedule_in: ScheduleRecurringCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    _verify_doctor_department(db, schedule_in.doctor_id, current_admin)
    try:
        return crud_schedule.create_recurring_schedules(db=db, schedule_in=schedule_in)
    except HTTPException as e:
        logger.error(f"Error creating recurring schedules: {e.detail}")
        raise e


@router.get("/", response_model=List[SchedulePublic])
def list_schedules_endpoint(
    doctor_ids: Optional[List[uuid.UUID]] = Query(None),
    month: Optional[int] = None,
    year: Optional[int] = None,
    time_period: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    allowed_doctor_ids = doctor_ids
    if not current_admin.is_system_admin:
        department_doctors = db.query(Doctor).filter(Doctor.specialty == current_admin.department).all()
        department_doctor_ids = {doc.doctor_id for doc in department_doctors}
        if doctor_ids:
            allowed_doctor_ids = [doc_id for doc_id in doctor_ids if doc_id in department_doctor_ids]
            if not allowed_doctor_ids: return []
        else:
            allowed_doctor_ids = list(department_doctor_ids)
            if not allowed_doctor_ids: return []
    return crud_schedule.list_schedules(
        db=db, doctor_ids=allowed_doctor_ids, month=month, year=year, time_period=time_period, skip=skip, limit=limit
    )


@router.get("/{schedule_id}", response_model=SchedulePublic)
def get_schedule_endpoint(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    db_schedule = _verify_schedule_department(db, schedule_id, current_admin)
    return db_schedule


@router.put("/{schedule_id}", response_model=SchedulePublic)
def update_schedule_endpoint(
    schedule_id: uuid.UUID,
    schedule_in: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    _verify_schedule_department(db, schedule_id, current_admin)
    try:
        db_schedule = crud_schedule.update_schedule(db=db, schedule_id=schedule_id, schedule_in=schedule_in)
        if not db_schedule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
        return db_schedule
    except HTTPException as e:
        logger.error(f"Error updating schedule {schedule_id}: {e.detail}")
        raise e


@router.put("/recurring/{recurring_group_id}", response_model=List[SchedulePublic])
def update_recurring_schedules_endpoint(
    recurring_group_id: uuid.UUID,
    schedule_in: ScheduleRecurringCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    # For recurring updates, we verify the department of the doctor_id in the payload
    _verify_doctor_department(db, schedule_in.doctor_id, current_admin)
    try:
        return crud_schedule.update_recurring_schedules(
            db=db, recurring_group_id=recurring_group_id, schedule_in=schedule_in
        )
    except HTTPException as e:
        logger.error(f"Error updating recurring schedules for group {recurring_group_id}: {e.detail}")
        raise e


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule_endpoint(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    _verify_schedule_department(db, schedule_id, current_admin)
    db_schedule = crud_schedule.delete_schedule(db=db, schedule_id=schedule_id)
    if not db_schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return


@router.delete("/recurring/{recurring_group_id}", status_code=status.HTTP_200_OK)
def delete_recurring_schedules_endpoint(
    recurring_group_id: uuid.UUID,
    start_date: date,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    # We need to find one schedule in the group to verify department
    first_schedule = db.query(Schedule).filter(Schedule.recurring_group_id == recurring_group_id).first()
    if first_schedule:
        _verify_schedule_department(db, first_schedule.schedule_id, current_admin)

    deleted_count = crud_schedule.delete_recurring_schedules(
        db=db, recurring_group_id=recurring_group_id, start_date=start_date
    )
    if deleted_count == 0:
        return {"message": "No future recurring schedules found to delete."}
    return {"message": f"Successfully deleted {deleted_count} future recurring schedules."}
