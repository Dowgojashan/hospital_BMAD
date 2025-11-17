from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from ...db.session import get_db
from ...crud import crud_patient
from ...schemas.patient import PatientPublic
from ...models.doctor import Doctor
from ..dependencies import get_current_active_doctor


router = APIRouter()

@router.get("/{patient_id}", response_model=PatientPublic)
def read_patient(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """
    Fetch a single patient by their ID.
    Only accessible by doctors.
    """
    db_patient = crud_patient.get_patient(db, patient_id=patient_id)
    if db_patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    
    # Optional: Add logic here to verify the doctor has a relationship
    # with the patient (e.g., via an appointment) before returning details.
    # For now, any authenticated doctor can see any patient.

    return db_patient

@router.get("/lookup", response_model=dict)
async def lookup_patient(
    patient_name: str,
    patient_email: Optional[str] = None,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """
    Looks up a patient by name and optional email.
    Only accessible by doctors.
    """
    patients = crud_patient.get_patient_by_name_and_email(db, patient_name, patient_email)

    if not patients:
        return {"status": "no_match"}
    elif len(patients) == 1:
        return {"status": "unique_match", "patient_id": patients[0].patient_id}
    else:
        return {"status": "multiple_matches"}
