from fastapi import HTTPException, status # Import HTTPException and status

from sqlalchemy.orm import Session
from typing import Optional, Union
import uuid

from app.models import Admin, Doctor, Patient
from app.schemas.profile import (
    PatientProfileUpdate,
    DoctorProfileUpdate,
    AdminProfileUpdate,
)
from app.core.security import get_password_hash


def get_user_profile_by_id_and_role(
    db: Session, user_id: uuid.UUID, role: str
) -> Optional[Union[Admin, Doctor, Patient]]:
    if role == "admin":
        return db.query(Admin).filter(Admin.admin_id == user_id).first()
    elif role == "doctor":
        return db.query(Doctor).filter(Doctor.doctor_id == user_id).first()
    elif role == "patient":
        return db.query(Patient).filter(Patient.patient_id == user_id).first()
    return None


def update_patient_profile(
    db: Session, patient_id: uuid.UUID, profile_in: PatientProfileUpdate
) -> Optional[Patient]:
    db_patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not db_patient:
        return None

    update_data = profile_in.dict(exclude_unset=True)

    if "email" in update_data and update_data["email"] != db_patient.email:
        existing_patient = db.query(Patient).filter(Patient.email == update_data["email"]).first()
        if existing_patient:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered by another patient."
            )

    if "password" in update_data and update_data["password"]:
        db_patient.password_hash = get_password_hash(update_data["password"])
        del update_data["password"]

    for field, value in update_data.items():
        setattr(db_patient, field, value)

    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


def update_doctor_profile(
    db: Session, doctor_id: uuid.UUID, profile_in: DoctorProfileUpdate
) -> Optional[Doctor]:
    db_doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    if not db_doctor:
        return None

    update_data = profile_in.dict(exclude_unset=True)

    if "email" in update_data and update_data["email"] != db_doctor.email:
        existing_doctor = db.query(Doctor).filter(Doctor.email == update_data["email"]).first()
        if existing_doctor:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered by another doctor."
            )

    if "password" in update_data and update_data["password"]:
        db_doctor.password_hash = get_password_hash(update_data["password"])
        del update_data["password"]

    for field, value in update_data.items():
        setattr(db_doctor, field, value)

    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor


def update_admin_profile(
    db: Session, admin_id: uuid.UUID, profile_in: AdminProfileUpdate
) -> Optional[Admin]:
    db_admin = db.query(Admin).filter(Admin.admin_id == admin_id).first()
    if not db_admin:
        return None

    update_data = profile_in.dict(exclude_unset=True)

    if "email" in update_data and update_data["email"] != db_admin.email:
        existing_admin = db.query(Admin).filter(Admin.email == update_data["email"]).first()
        if existing_admin:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered by another admin."
            )

    if "password" in update_data and update_data["password"]:
        db_admin.password_hash = get_password_hash(update_data["password"])
        del update_data["password"]

    for field, value in update_data.items():
        setattr(db_admin, field, value)

    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin
