import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.patient import PatientCreate, PatientPublic
from app.schemas.token import Token
from app.crud import crud_user
from app.core import security

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register/patient", response_model=PatientPublic, status_code=201)
def register_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    logger.info("register_patient: start")
    patient = crud_user.create_patient(db, payload)
    logger.info("register_patient: end")
    return patient


@router.post("/auth/token", response_model=Token)
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
    # token payload
    access_token_expires = timedelta(minutes=int(60))
    token = security.create_access_token({"sub": str(getattr(user, f"{role}_id", getattr(user, 'patient_id', None))), "role": role}, expires_delta=access_token_expires)
    logger.info("login_for_access_token: end")
    return {"access_token": token, "token_type": "bearer"}
