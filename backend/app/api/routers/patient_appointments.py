from typing import List, Optional # Import Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query # Import Query
from sqlalchemy.orm import Session
import uuid
from pydantic import BaseModel # Import BaseModel

from app.db.session import get_db
from app.schemas.appointment import AppointmentCreate, AppointmentPublic, AppointmentInDB
from app.services.appointment_service import appointment_service
from app.services.checkin_service import checkin_service # Import checkin_service
from app.api.dependencies import get_current_patient # Assuming get_current_patient exists
from app.crud import crud_doctor # Import crud_doctor module
from app.crud.crud_user import get_patient
from app.crud import crud_schedule # Import crud_schedule
from app.schemas.schedule import SchedulePublic, ScheduleDoctorPublic # Import SchedulePublic and ScheduleDoctorPublic
from app.schemas.doctor import DoctorPublic # Import DoctorPublic

router = APIRouter()

class CheckinRequest(BaseModel):
    checkin_method: str # "online" or "onsite"

@router.post("/appointments", response_model=AppointmentPublic, status_code=status.HTTP_201_CREATED)
def create_patient_appointment(
    appointment_in: AppointmentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_patient: dict = Depends(get_current_patient) # Patient must be logged in
):
    """
    Create a new appointment for the current patient.
    """
    patient_id = current_patient["patient_id"] # Assuming patient_id is in the token payload

    try:
        appointment = appointment_service.create_appointment(
            db, 
            patient_id=patient_id, 
            appointment_in=appointment_in,
            background_tasks=background_tasks
        )
        # For AppointmentPublic, we need doctor_name, specialty, patient_name
        # This would typically be handled by a more comprehensive service method or a view.
        # For now, we'll just return the basic appointment and assume frontend can fetch details.
        # Or, we can enrich it here if needed. Let's enrich it for better UX.
        

        db_doctor = crud_doctor.get_doctor(db, doctor_id=appointment.doctor_id)
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

@router.post("/appointments/{appointment_id}/check-in", status_code=status.HTTP_200_OK)
def patient_check_in(
    appointment_id: uuid.UUID,
    checkin_request: CheckinRequest,
    db: Session = Depends(get_db),
    current_patient: dict = Depends(get_current_patient)
):
    """
    Allow a patient to check in for their appointment.
    """
    patient_id = current_patient["patient_id"]
    try:
        result = checkin_service.create_checkin(
            db,
            patient_id=patient_id,
            appointment_id=appointment_id,
            checkin_method=checkin_request.checkin_method
        )
        return {"message": "報到成功", "ticket_number": result["ticket_number"], "status": result["status"]}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"報到失敗: {e}"
        )

@router.get("/appointments", response_model=List[AppointmentPublic])
def list_patient_appointments(
    db: Session = Depends(get_db),
    current_patient: dict = Depends(get_current_patient),
    start_date: Optional[str] = Query(None), # Optional start date for filtering
    end_date: Optional[str] = Query(None),   # Optional end date for filtering
    statuses: Optional[List[str]] = Query(None) # Optional list of statuses
):
    """
    Retrieve a list of appointments for the current patient, with optional date and status filtering.
    """
    patient_id = current_patient["patient_id"]

    appointments_with_details = appointment_service.get_patient_appointments_with_details(
        db, 
        patient_id=patient_id,
        start_date=start_date,
        end_date=end_date,
        statuses=statuses
    )
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

@router.get("/schedules", response_model=List[ScheduleDoctorPublic])
def list_schedules_for_patient(
    db: Session = Depends(get_db),
    specialty: Optional[str] = Query(None),
    doctor_id: Optional[uuid.UUID] = Query(None),
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    time_period: Optional[str] = Query(None),
):
    """
    Retrieve a list of public schedules for patients to book appointments.
    """
    schedules = crud_schedule.list_public_schedules(
        db,
        specialty=specialty,
        doctor_id=doctor_id,
        month=month,
        year=year,
        time_period=time_period,
    )
    return schedules

@router.get("/doctors", response_model=List[DoctorPublic])
def list_doctors_for_patient(
    db: Session = Depends(get_db),
    specialty: Optional[str] = Query(None),
):
    """
    Retrieve a list of doctors for patients to filter by specialty.
    """
    doctors = crud_doctor.list_doctors(db, specialty=specialty)
    return doctors
