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
        # Start a transaction
        with db.begin():
            # 1. Check if the schedule exists and is available
            # Use SELECT ... FOR UPDATE to lock the schedule row to prevent race conditions
            # when multiple patients try to book the same slot.
            schedule_query = db.query(Schedule).filter(
                Schedule.doctor_id == appointment_in.doctor_id,
                Schedule.date == appointment_in.date,
                Schedule.time_period == appointment_in.time_period,
                Schedule.status == "active" # Ensure schedule is active
            ).with_for_update() # Apply row-level lock

            schedule = schedule_query.first()

            if not schedule:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Schedule not found or not active."
                )

            # 2. Check for existing appointments for this schedule slot
            # This assumes a schedule slot can only have one appointment.
            # If multiple appointments per slot are allowed, this logic needs adjustment
            # (e.g., checking remaining capacity).
            existing_appointment = db.query(Appointment).filter(
                Appointment.doctor_id == appointment_in.doctor_id,
                Appointment.date == appointment_in.date,
                Appointment.time_period == appointment_in.time_period,
                Appointment.status.in_(["scheduled", "confirmed"]) # Consider only active appointments
            ).first()

            if existing_appointment:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This time slot is already booked."
                )

            # 3. Create the appointment
            new_appointment = crud_appointment.create(db, obj_in=appointment_in, patient_id=patient_id)

            # No need to update schedule status here unless we want to mark it as "full"
            # The existence of an appointment for the slot implies it's taken.

            return new_appointment

appointment_service = AppointmentService()
