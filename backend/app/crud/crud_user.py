import logging
import re
from sqlalchemy.orm import Session
from typing import Optional, Tuple, List
from fastapi import HTTPException, status # Import status
import uuid # Import uuid
from datetime import datetime # Import datetime

from app.models import Admin, Doctor, Patient
from app.schemas.patient import PatientCreate, PatientUpdate # Import PatientUpdate
from app.core import security

logger = logging.getLogger(__name__)


def authenticate_user(db: Session, username: str, password: str) -> Optional[Tuple[object, str]]:
    """Check ADMIN, then DOCTOR, then PATIENT for given username and password.
    Returns tuple (user_model, role) on success, or None on failure.
    """
    logger.info("authenticate_user: start")

    # 1) ADMIN - match account_username
    admin = db.query(Admin).filter(Admin.account_username == username).one_or_none()
    if admin:
        if security.verify_password(password, admin.password_hash):
            logger.info("authenticate_user: end (admin)")
            return admin, "admin"

    # 2) DOCTOR - match doctor_login_id
    doctor = db.query(Doctor).filter(Doctor.doctor_login_id == username).one_or_none()
    if doctor:
        if security.verify_password(password, doctor.password_hash):
            logger.info("authenticate_user: end (doctor)")
            return doctor, "doctor"

    # 3) PATIENT - match email (PRD: patient login by email)
    patient = db.query(Patient).filter(Patient.email == username).one_or_none()
    if patient:
        if security.verify_password(password, patient.password_hash):
            logger.info("authenticate_user: end (patient)")
            return patient, "patient"

    logger.info("authenticate_user: end (not found)")
    return None


def create_patient(
    db: Session,
    patient_in: PatientCreate,
    is_verified: bool = False,
    verification_code: Optional[str] = None,
    code_expires_at: Optional[datetime] = None
):
    logger.info("create_patient: start")

    # Check for existing email
    existing_patient_email = db.query(Patient).filter(Patient.email == patient_in.email).first()
    if existing_patient_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check for existing card number
    existing_patient_card = db.query(Patient).filter(Patient.card_number == patient_in.card_number).first()
    if existing_patient_card:
        raise HTTPException(status_code=400, detail="Card number already registered")

    hashed = security.get_password_hash(patient_in.password)
    db_obj = Patient(
        card_number=patient_in.card_number,
        name=patient_in.name,
        password_hash=hashed,
        dob=patient_in.dob,
        phone=patient_in.phone,
        email=patient_in.email,
        is_verified=is_verified,
        verification_code=verification_code,
        code_expires_at=code_expires_at,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    logger.info("create_patient: end")
    return db_obj


def get_patient(db: Session, patient_id: uuid.UUID) -> Optional[Patient]:
    return db.query(Patient).filter(Patient.patient_id == patient_id).first()

def get_patient_by_email(db: Session, email: str) -> Optional[Patient]:
    return db.query(Patient).filter(Patient.email == email).first()


def list_patients(db: Session, skip: int = 0, limit: int = 100) -> List[Patient]:
    return db.query(Patient).offset(skip).limit(limit).all()


def update_patient(db: Session, patient_id: uuid.UUID, patient_in: PatientUpdate) -> Optional[Patient]:
    db_patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not db_patient:
        return None

    update_data = patient_in.dict(exclude_unset=True)

    if "email" in update_data and update_data["email"] != db_patient.email:
        existing_patient = db.query(Patient).filter(Patient.email == update_data["email"]).first()
        if existing_patient:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered by another patient."
            )
    
    if "card_number" in update_data and update_data["card_number"] != db_patient.card_number:
        existing_card = db.query(Patient).filter(Patient.card_number == update_data["card_number"]).first()
        if existing_card:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Card number already registered by another patient."
            )

    if "password" in update_data and update_data["password"]:
        db_patient.password_hash = security.get_password_hash(update_data["password"])
        del update_data["password"]

    for field, value in update_data.items():
        setattr(db_patient, field, value)

    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


def delete_patient(db: Session, patient_id: uuid.UUID) -> Optional[Patient]:
    db_patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not db_patient:
        return None
    db.delete(db_patient)
    db.commit()
    return db_patient