from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.dependencies import get_current_active_doctor
from app.models.doctor import Doctor
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordPublic
from app.crud.crud_medical_record import medical_record_crud

from app.crud.crud_patient import patient_crud
from app.crud.crud_appointment import appointment_crud

router = APIRouter()

@router.post("/records", response_model=MedicalRecordPublic, status_code=status.HTTP_201_CREATED)
async def create_medical_record(
    medical_record_in: MedicalRecordCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    # Validate patient_id
    patient = patient_crud.get(db, patient_id=medical_record_in.patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    # Validate appointment_id if provided
    if medical_record_in.appointment_id:
        appointment = appointment_crud.get(db, appointment_id=medical_record_in.appointment_id)
        if not appointment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
        # Optional: Further validation to ensure appointment belongs to the patient and doctor

    # Set doctor_id from current_doctor
    medical_record_in.doctor_id = current_doctor.doctor_id

    medical_record = medical_record_crud.create(db, obj_in=medical_record_in)
    return medical_record

from app.schemas.medical_record import MedicalRecordUpdate

@router.put("/records/{record_id}", response_model=MedicalRecordPublic)
async def update_medical_record(
    record_id: uuid.UUID,
    medical_record_update: MedicalRecordUpdate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    medical_record = medical_record_crud.get(db, record_id=record_id)
    if not medical_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medical record not found.")

    if medical_record.doctor_id != current_doctor.doctor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this medical record.")

    updated_medical_record = medical_record_crud.update(db, db_obj=medical_record, obj_in=medical_record_update)
    return updated_medical_record

# TODO: Implement GET /api/v1/records/{record_id} endpoint
# TODO: Implement GET /api/v1/patients/{patient_id}/records endpoint
# TODO: Implement GET /api/v1/doctors/{doctor_id}/records endpoint
