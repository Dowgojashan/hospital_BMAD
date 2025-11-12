from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.models.doctor import Doctor
from app.schemas.doctor import DoctorCreate, DoctorUpdate
from app.core.security import get_password_hash


def get_doctor(db: Session, doctor_id: uuid.UUID) -> Optional[Doctor]:
    return db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()


def list_doctors(db: Session, specialty: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Doctor]:
    query = db.query(Doctor)
    if specialty:
        query = query.filter(Doctor.specialty == specialty)
    return query.offset(skip).limit(limit).all()


def create_doctor(db: Session, doctor_in: DoctorCreate) -> Doctor:
    print(f"Received doctor_in data: {doctor_in.dict()}") # Debug print
    hashed_password = get_password_hash(doctor_in.password)
    db_doctor = Doctor(
        doctor_login_id=doctor_in.doctor_login_id,
        password_hash=hashed_password,
        name=doctor_in.name,
        specialty=doctor_in.specialty,
        email=doctor_in.email,
    )
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor


def update_doctor(db: Session, doctor_id: uuid.UUID, doctor_in: DoctorUpdate) -> Optional[Doctor]:
    db_doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    if not db_doctor:
        return None

    update_data = doctor_in.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data["password"])
        del update_data["password"]

    for field, value in update_data.items():
        setattr(db_doctor, field, value)

    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor


def delete_doctor(db: Session, doctor_id: uuid.UUID) -> Optional[Doctor]:
    db_doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    if not db_doctor:
        return None
    db.delete(db_doctor)
    db.commit()
    return db_doctor
