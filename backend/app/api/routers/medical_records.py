# backend/app/api/routers/medical_records.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from ...db.session import get_db
from ...schemas.medical_record import MedicalRecordCreate, MedicalRecordUpdate, MedicalRecord as MedicalRecordSchema
from ...crud import medical_record as crud_medical_record
from ..dependencies import get_current_user
from ...models.medical_record import MedicalRecord as MedicalRecordModel

router = APIRouter()

@router.post("/", response_model=MedicalRecordSchema, status_code=status.HTTP_201_CREATED)
def create_medical_record(
    medical_record: MedicalRecordCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can create medical records."
        )
    
    # Ensure the doctor_id is set to the current user's ID
    medical_record_data = medical_record.dict()
    medical_record_data["doctor_id"] = current_user["user_obj"].doctor_id

    db_medical_record = crud_medical_record.create_medical_record(db=db, medical_record=medical_record_data)
    return db_medical_record

@router.get("/doctor/medical-records", response_model=List[MedicalRecordSchema])
def read_doctor_medical_records(
    patient_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can view their own medical records."
        )
    
    medical_records_from_db = crud_medical_record.get_medical_records_by_doctor(
        db=db, doctor_id=current_user["user_obj"].doctor_id, patient_id=patient_id
    )

    # Manually construct the response to include names from relationships
    response_records = []
    for record in medical_records_from_db:
        record_data = MedicalRecordSchema.model_validate(record)
        if record.doctor:
            record_data.doctor_name = record.doctor.name
        if record.patient:
            record_data.patient_name = record.patient.name
        response_records.append(record_data)
        
    return response_records

@router.get("/{record_id}", response_model=MedicalRecordSchema)
def read_medical_record(
    record_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_medical_record = crud_medical_record.get_medical_record(db=db, record_id=record_id)
    if db_medical_record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medical record not found")
    
    # Only the doctor who created the record or an admin can view it
    if current_user["role"] == "doctor" and db_medical_record.doctor_id != current_user["user_obj"].doctor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this medical record."
        )
    if current_user["role"] == "patient" and db_medical_record.patient_id != current_user["user_obj"].patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this medical record."
        )
    
    return db_medical_record

@router.put("/{record_id}", response_model=MedicalRecordSchema)
def update_medical_record(
    record_id: uuid.UUID,
    medical_record: MedicalRecordUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_medical_record = crud_medical_record.get_medical_record(db=db, record_id=record_id)
    if db_medical_record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medical record not found")
    
    if current_user["role"] != "doctor" or db_medical_record.doctor_id != current_user["user_obj"].doctor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the doctor who created the record can update it."
        )
    
    db_medical_record = crud_medical_record.update_medical_record(db=db, db_medical_record=db_medical_record, medical_record=medical_record)
    return db_medical_record

@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medical_record(
    record_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_medical_record = crud_medical_record.get_medical_record(db=db, record_id=record_id)
    if db_medical_record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medical record not found")
    
    if current_user["role"] != "doctor" or db_medical_record.doctor_id != current_user["user_obj"].doctor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the doctor who created the record can delete it."
        )
    
    crud_medical_record.delete_medical_record(db=db, record_id=record_id)
    return {"ok": True}
