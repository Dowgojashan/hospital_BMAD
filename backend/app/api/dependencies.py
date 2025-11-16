from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import uuid
import logging
from jose import JWTError

logger = logging.getLogger(__name__)

from app.db.session import get_db
from app.core.security import verify_token
from app.models import Admin, Doctor, Patient
from app.crud.crud_user import get_patient # Corrected import for patient CRUD
from app.crud.crud_doctor import get_doctor # Corrected import for doctor CRUD
from app.crud.crud_admin import get_admin # Corrected import for admin CRUD

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

async def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = verify_token(token)
        user_id: str = payload.get("sub")
        user_role: str = payload.get("role")
        if user_id is None or user_role is None:
            logger.warning("Token payload missing user_id or role.")
            raise credentials_exception
    except JWTError as e:
        logger.error(f"JWTError during token verification: {e}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Unexpected error during token verification: {e}")
        raise credentials_exception

    user = None
    if user_role == "patient":
        user = get_patient(db, patient_id=user_id) # Use get_patient from crud_user
    elif user_role == "doctor":
        user = get_doctor(db, doctor_id=user_id) # Use get_doctor from crud_doctor
    elif user_role == "admin":
        user = get_admin(db, admin_id=user_id) # Use get_admin from crud_admin

    if user is None:
        raise credentials_exception
    return {"user_id": user_id, "role": user_role, "user_obj": user}

async def get_current_patient(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "patient":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return {"patient_id": current_user["user_id"], "patient_obj": current_user["user_obj"]}

async def get_current_active_doctor(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return current_user["user_obj"]

async def get_current_active_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return current_user["user_obj"]
