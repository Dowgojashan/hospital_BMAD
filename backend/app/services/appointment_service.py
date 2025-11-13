# backend/app/services/appointment_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import uuid
from datetime import date

from app.crud.crud_appointment import appointment as crud_appointment
from app.schemas.appointment import AppointmentCreate, AppointmentInDB
from app.models.schedule import Schedule
from app.models.appointment import Appointment

class AppointmentService:
    def create_appointment(
        self, db: Session, *, patient_id: uuid.UUID, appointment_in: AppointmentCreate
    ) -> AppointmentInDB:
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

            return new_appointment

appointment_service = AppointmentService()
