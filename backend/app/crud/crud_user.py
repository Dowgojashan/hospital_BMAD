import logging
from sqlalchemy.orm import Session
from typing import Optional, Tuple
from fastapi import HTTPException

from app.models import Admin, Doctor, Patient
from app.schemas.patient import PatientCreate
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


def create_patient(db: Session, patient_in: PatientCreate):
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
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    logger.info("create_patient: end")
    return db_obj