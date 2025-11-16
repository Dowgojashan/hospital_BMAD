from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import uuid

from app.db.session import get_db
from app.core.security import verify_token
from app.models import Admin, Doctor, Patient
from app.crud.crud_patient import patient_crud
from app.crud.crud_doctor import doctor_crud
from app.crud.crud_admin import admin_crud

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
            raise credentials_exception
    except Exception:
        raise credentials_exception

    user = None
    if user_role == "patient":
        user = patient_crud.get(db, patient_id=user_id)
    elif user_role == "doctor":
        user = doctor_crud.get(db, doctor_id=user_id)
    elif user_role == "admin":
        user = admin_crud.get(db, admin_id=user_id)

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
