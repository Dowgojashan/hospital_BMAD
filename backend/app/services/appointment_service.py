# backend/app/services/appointment_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, BackgroundTasks
import uuid
from datetime import date
from typing import List # Import List
from sqlalchemy import case # Import case

from app.crud.crud_appointment import appointment as crud_appointment
from app.crud.crud_user import get_patient
from app.crud.crud_doctor import get_doctor
from app.schemas.appointment import AppointmentCreate, AppointmentInDB, AppointmentPublic
from app.models.schedule import Schedule
from app.models.appointment import Appointment
from app.models.doctor import Doctor # Import Doctor model
from app.models.patient import Patient # Import Patient model
from app.utils.email_sender import email_sender

class AppointmentService:
    def create_appointment(
        self, db: Session, *, patient_id: uuid.UUID, appointment_in: AppointmentCreate, background_tasks: BackgroundTasks
    ) -> AppointmentInDB:
            # 0. Prevent same-day booking
            if appointment_in.date == date.today():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="不開放預約當日門診"
                )

            # 1. Check if the schedule exists and is available
            # Use SELECT ... FOR UPDATE to lock the schedule row to prevent race conditions
            # when multiple patients try to book the same slot.
            schedule_query = db.query(Schedule).filter(
                Schedule.doctor_id == appointment_in.doctor_id,
                Schedule.date == appointment_in.date,
                Schedule.time_period == appointment_in.time_period,
            ).with_for_update() # Apply row-level lock

            schedule = schedule_query.first()

            if not schedule:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Schedule not found or not active."
                )

            # 2. Check for duplicate booking by the same patient for the same slot
            existing_patient_appointment = db.query(Appointment).filter(
                Appointment.patient_id == patient_id,
                Appointment.doctor_id == appointment_in.doctor_id,
                Appointment.date == appointment_in.date,
                Appointment.time_period == appointment_in.time_period,
                Appointment.status.in_(["scheduled", "confirmed", "waiting", "checked_in", "in_consult"]) # Consider active statuses
            ).first()

            if existing_patient_appointment:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="您已預約此時段，請勿重複預約。"
                )

            # 3. Check if there is capacity in the schedule slot
            if schedule.booked_patients >= schedule.max_patients:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="該時段已滿"
                )

            # 4. Increment booked_patients count in the schedule
            schedule.booked_patients += 1
            db.add(schedule)
            db.flush() # Flush to ensure the update is part of the current transaction

            # 5. Create the appointment
            new_appointment = crud_appointment.create(db, obj_in=appointment_in, patient_id=patient_id)
            
            db.commit()
            db.refresh(new_appointment)

            # 6. Send confirmation email in the background
            patient = get_patient(db, patient_id=patient_id)
            doctor = get_doctor(db, doctor_id=appointment_in.doctor_id)

            if patient and doctor:
                time_period_map = {
                    "morning": "上午診",
                    "afternoon": "下午診",
                    "night": "夜間診",
                }
                
                appointment_details = {
                    "patient_name": patient.name,
                    "doctor_name": doctor.name,
                    "department": doctor.specialty,
                    "date": new_appointment.date.strftime("%Y-%m-%d"),
                    "time_period": time_period_map.get(new_appointment.time_period, new_appointment.time_period),
                }
                background_tasks.add_task(
                    email_sender.send_appointment_confirmation,
                    recipient_email=patient.email,
                    appointment_details=appointment_details
                )

            return new_appointment

    def get_patient_appointments_with_details(
        self, db: Session, *, patient_id: uuid.UUID
    ) -> List[AppointmentPublic]:
        appointments = (
            db.query(Appointment, Doctor, Patient)
            .join(Doctor, Appointment.doctor_id == Doctor.doctor_id)
            .join(Patient, Appointment.patient_id == Patient.patient_id)
            .filter(Appointment.patient_id == patient_id)
            .order_by(
                case(
                    (Appointment.status.in_(["scheduled", "confirmed", "waiting", "checked_in", "in_consult"]), 0), # Active/Upcoming
                    (Appointment.status.in_(["completed"]), 1), # Completed
                    (Appointment.status.in_(["cancelled", "no_show"]), 2), # Cancelled/No-show
                    else_=3 # Other statuses
                ),
                Appointment.date.asc(),
                Appointment.time_period.asc()
            )
            .all()
        )

        result = []
        for appointment, doctor, patient in appointments:
            result.append(
                AppointmentPublic(
                    **AppointmentInDB.model_validate(appointment).model_dump(),
                    doctor_name=doctor.name,
                    specialty=doctor.specialty,
                    patient_name=patient.name
                )
            )
        return result

        return result

    def cancel_appointment(
        self, db: Session, *, appointment_id: uuid.UUID, patient_id: uuid.UUID
    ) -> AppointmentInDB:
            appointment = db.query(Appointment).filter(
                Appointment.appointment_id == appointment_id
            ).with_for_update().first()

            if not appointment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="預約不存在。"
                )

            # Ensure patient_id from token is a UUID object for comparison
            if appointment.patient_id != uuid.UUID(str(patient_id)):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="您無權取消此預約。"
                )

            # Only allow cancellation for 'scheduled', 'confirmed', 'waitlist' appointments
            if appointment.status not in ["scheduled", "confirmed", "waitlist"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"此預約狀態為 '{appointment.status}'，無法取消。"
                )

            # Update appointment status
            appointment.status = "cancelled"
            db.add(appointment)

            # Decrement booked_patients in the corresponding schedule
            schedule = db.query(Schedule).filter(
                Schedule.doctor_id == appointment.doctor_id,
                Schedule.date == appointment.date,
                Schedule.time_period == appointment.time_period,
            ).with_for_update().first()

            if schedule and schedule.booked_patients > 0:
                schedule.booked_patients -= 1
                db.add(schedule)
            
            db.flush() # Flush to ensure all updates are part of the transaction
            db.commit() # Commit the transaction to save changes permanently
            return appointment

appointment_service = AppointmentService()
