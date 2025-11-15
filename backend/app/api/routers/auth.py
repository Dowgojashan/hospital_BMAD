import logging
import random
from datetime import timedelta, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import EmailStr

from app.db.session import get_db
from app.schemas.patient import PatientCreate, PatientPublic
from app.schemas.token import Token
from app.crud import crud_user
from app.core import security
from app.utils.email_sender import email_sender # Import the email sender
from app.models.patient import Patient # Import Patient model
from app.schemas.auth import EmailRequest, VerifyEmailRequest, ResetPasswordRequest # Import new auth schemas
import secrets

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register/patient", response_model=PatientPublic, status_code=201)
def register_patient(
    payload: PatientCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    logger.info("register_patient: start")

    # Check for existing email
    existing_patient_email = crud_user.get_patient_by_email(db, payload.email)
    if existing_patient_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Generate OTP and expiration
    otp = str(random.randint(100000, 999999))
    otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Create patient with verification details
    patient = crud_user.create_patient(
        db,
        payload,
        is_verified=False,
        verification_code=otp,
        code_expires_at=otp_expires_at
    )

    # Send verification email in the background
    background_tasks.add_task(email_sender.send_verification_email, patient.email, otp)

    logger.info("register_patient: end")
    return patient


@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    logger.info("login_for_access_token: start")
    auth = crud_user.authenticate_user(db, form_data.username, form_data.password)
    if not auth:
        logger.info("login_for_access_token: failed auth")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user, role = auth

    # Check if patient is verified
    if role == "patient" and not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your email for a verification code or resend it.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # token payload
    access_token_expires = timedelta(minutes=int(60))
    token_data = {"sub": str(getattr(user, f"{role}_id", getattr(user, 'patient_id', None))), "role": role}
    if role == "patient":
        token_data["is_verified"] = user.is_verified # Include is_verified for patients
    token = security.create_access_token(token_data, expires_delta=access_token_expires)
    logger.info("login_for_access_token: end")
    return {"access_token": token, "token_type": "bearer"}


@router.post("/resend-verification-email", status_code=status.HTTP_200_OK)
def resend_verification_email(
    payload: EmailRequest, # Use EmailRequest schema
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    patient = crud_user.get_patient_by_email(db, payload.email) # Use payload.email
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found with this email.")
    if patient.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already verified.")

    otp = str(random.randint(100000, 999999))
    otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    patient.verification_code = otp
    patient.code_expires_at = otp_expires_at
    db.add(patient)
    db.commit()
    db.refresh(patient)

    background_tasks.add_task(email_sender.send_verification_email, patient.email, otp)
    return {"message": "Verification email resent successfully."}


@router.post("/verify-email", status_code=status.HTTP_200_OK)
def verify_email(
    payload: VerifyEmailRequest, # Use VerifyEmailRequest schema
    db: Session = Depends(get_db)
):
    patient = crud_user.get_patient_by_email(db, payload.email) # Use payload.email
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found with this email.")
    if patient.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already verified.")
    if not patient.verification_code or patient.verification_code != payload.otp: # Use payload.otp
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code.")
    if patient.code_expires_at and patient.code_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code has expired.")

    patient.is_verified = True
    patient.verification_code = None
    patient.code_expires_at = None
    db.add(patient)
    db.commit()
    db.refresh(patient)

    return {"message": "Email verified successfully."}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(
    payload: EmailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    patient = crud_user.get_patient_by_email(db, payload.email)
    if not patient:
        # To prevent user enumeration, we don't reveal if the user was found or not.
        # We'll log it, but return a generic success message.
        logger.info(f"Password reset requested for non-existent email: {payload.email}")
        return {"message": "If an account with this email exists, a password reset link has been sent."}

    # Generate a secure, URL-safe token
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    
    patient.reset_password_token = token
    patient.reset_token_expires_at = now + timedelta(hours=1) # Token valid for 1 hour
    db.add(patient)
    db.commit()

    # Send password reset email in the background
    background_tasks.add_task(email_sender.send_password_reset_email, patient.email, token)

    return {"message": "If an account with this email exists, a password reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    patient = crud_user.get_patient_by_reset_token(db, payload.token)
    
    # Validate password length
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    # Check if token is valid and not expired
    if not patient or not patient.reset_token_expires_at or patient.reset_token_expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token."
        )

    # Update password
    patient.password_hash = security.get_password_hash(payload.password)
    
    # Invalidate the token
    patient.reset_password_token = None
    patient.reset_token_expires_at = None
    
    db.add(patient)
    db.commit()

    return {"message": "Password has been reset successfully."}