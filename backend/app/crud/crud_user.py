import logging
import re
from sqlalchemy.orm import Session
from typing import Optional, Tuple, List
from fastapi import HTTPException, status
import uuid
from datetime import datetime, date

from app.models import Admin, Doctor, Patient
from app.schemas.patient import PatientCreate, PatientUpdate
from app.core import security
from .crud_patient import patient_crud 

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
    patient = patient_crud.get_by_email(db, email=username)
    if patient:
        if security.verify_password(password, patient.password_hash):
            logger.info("authenticate_user: end (patient)")
            return patient, "patient"

    logger.info("authenticate_user: end (not found)")
    return None