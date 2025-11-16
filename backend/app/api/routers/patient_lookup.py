from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid

from ...db.session import get_db
from ...crud import crud_patient
from ..dependencies import get_current_user # Assuming get_current_user is needed for authentication


router = APIRouter()

@router.get("/lookup", response_model=dict)
async def lookup_patient(
    patient_name: str,
    patient_email: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user) # Assuming only authenticated users can lookup patients
):
    if current_user["role"] not in ["doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can lookup patients."
        )

    patients = crud_patient.get_patient_by_name_and_email(db, patient_name, patient_email)

    if not patients:
        return {"status": "no_match"}
    elif len(patients) == 1:
        return {"status": "unique_match", "patient_id": patients[0].patient_id}
    else:
        return {"status": "multiple_matches"}
