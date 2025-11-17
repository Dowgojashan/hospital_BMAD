from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any
from uuid import UUID
from datetime import date, timedelta

from app.db.session import get_db
from app.crud.crud_user import update_patient_suspended_until, get_patient
from app.api.dependencies import get_current_active_admin # Corrected dependency import

router = APIRouter()

@router.post("/patients/{patient_id}/suspend", response_model=dict, status_code=status.HTTP_200_OK)
async def suspend_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_admin_user: Any = Depends(get_current_active_admin), # RBAC protection
) -> Any:
    """
    Manually suspends a patient by setting their `suspended_until` date.
    Requires admin privileges.
    """
    patient = get_patient(db, patient_id=patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    # Suspend for a fixed period (e.g., 180 days) or indefinitely
    suspended_until = date.today() + timedelta(days=180)
    updated_patient = update_patient_suspended_until(db, patient_id=patient_id, suspended_until=suspended_until)

    if not updated_patient:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to suspend patient.")

    return {"message": f"Patient {patient_id} suspended until {suspended_until}."}

@router.post("/patients/{patient_id}/unsuspend", response_model=dict, status_code=status.HTTP_200_OK)
async def unsuspend_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_admin_user: Any = Depends(get_current_active_admin), # RBAC protection
) -> Any:
    """
    Manually unsuspends a patient by clearing their `suspended_until` date.
    Requires admin privileges.
    """
    patient = get_patient(db, patient_id=patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    updated_patient = update_patient_suspended_until(db, patient_id=patient_id, suspended_until=None)

    if not updated_patient:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to unsuspend patient.")

    return {"message": f"Patient {patient_id} unsuspended."}
