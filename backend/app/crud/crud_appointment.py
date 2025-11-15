# backend/app/crud/crud_appointment.py
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import date

from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate

class AppointmentCRUD:
    def create(self, db: Session, *, obj_in: AppointmentCreate, patient_id: uuid.UUID, schedule_id: uuid.UUID) -> Appointment:
        db_obj = Appointment(
            patient_id=patient_id,
            doctor_id=obj_in.doctor_id,
            schedule_id=schedule_id, # Assign the schedule_id
            date=obj_in.date,
            time_period=obj_in.time_period,
            status="scheduled" # Default status
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get(self, db: Session, appointment_id: uuid.UUID) -> Optional[Appointment]:
        return db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()

    def get_multi_by_patient(self, db: Session, patient_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Appointment]:
        return db.query(Appointment).filter(Appointment.patient_id == patient_id).offset(skip).limit(limit).all()

    def get_multi_by_doctor(self, db: Session, doctor_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Appointment]:
        return db.query(Appointment).filter(Appointment.doctor_id == doctor_id).offset(skip).limit(limit).all()

    def update(self, db: Session, *, db_obj: Appointment, obj_in: AppointmentUpdate) -> Appointment:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_status(self, db: Session, *, appointment_id: uuid.UUID, new_status: str) -> Optional[Appointment]:
        db_obj = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
        if db_obj:
            db_obj.status = new_status
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, appointment_id: uuid.UUID) -> Optional[Appointment]:
        obj = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
        if obj:
            db.delete(obj)
            db.commit()
        return obj

appointment_crud = AppointmentCRUD()
