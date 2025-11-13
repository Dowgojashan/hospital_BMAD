# backend/app/api/routers/patient_appointments.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from typing import List

from app.db.session import get_db
from app.schemas.appointment import AppointmentCreate, AppointmentPublic, AppointmentInDB
from app.services.appointment_service import appointment_service
from app.api.dependencies import get_current_patient # Assuming get_current_patient exists
from app.crud.crud_doctor import get_doctor
from app.crud.crud_user import get_patient

router = APIRouter()

@router.post("/appointments", response_model=AppointmentPublic, status_code=status.HTTP_201_CREATED)
def create_patient_appointment(
    appointment_in: AppointmentCreate,
    db: Session = Depends(get_db),
    current_patient: dict = Depends(get_current_patient) # Patient must be logged in
):
    """
    Create a new appointment for the current patient.
    """
    patient_id = current_patient["patient_id"] # Assuming patient_id is in the token payload

    try:
        appointment = appointment_service.create_appointment(db, patient_id=patient_id, appointment_in=appointment_in)
        # For AppointmentPublic, we need doctor_name, specialty, patient_name
        # This would typically be handled by a more comprehensive service method or a view.
        # For now, we'll just return the basic appointment and assume frontend can fetch details.
        # Or, we can enrich it here if needed. Let's enrich it for better UX.
        

        db_doctor = get_doctor(db, doctor_id=appointment.doctor_id)
        db_patient = get_patient(db, patient_id=appointment.patient_id)

        if not db_doctor or not db_patient:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not retrieve doctor or patient details for appointment."
            )

        return AppointmentPublic(
            **AppointmentInDB.model_validate(appointment).model_dump(),
            doctor_name=db_doctor.name,
            specialty=db_doctor.specialty,
            patient_name=db_patient.name
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create appointment: {e}"
        )

@router.get("/appointments", response_model=List[AppointmentPublic])
def list_patient_appointments(
    db: Session = Depends(get_db),
    current_patient: dict = Depends(get_current_patient)
):
    """
    Retrieve a list of appointments for the current patient.
    """
    patient_id = current_patient["patient_id"]

    appointments_with_details = appointment_service.get_patient_appointments_with_details(db, patient_id=patient_id)
    return appointments_with_details

@router.delete("/appointments/{appointment_id}", status_code=status.HTTP_200_OK)
def cancel_patient_appointment(
    appointment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_patient: dict = Depends(get_current_patient)
):
    """
    Allow a patient to cancel their own appointment.
    """
    patient_id = current_patient["patient_id"]
    appointment_service.cancel_appointment(db, appointment_id=appointment_id, patient_id=patient_id)
    return {"message": "預約已成功取消。"}
