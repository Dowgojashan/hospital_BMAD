from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import uuid

from app.db.session import get_db
from app.core.security import verify_token
from app.models import Admin, Doctor, Patient

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

async def get_current_active_user_with_role(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> tuple:
    print(f"Received token in dependency: {token}") # Debug print
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = verify_token(token)
        print(f"Token payload: {payload}") # Debug print
        user_id: str = payload.get("sub")
        user_role: str = payload.get("role")
        print(f"User ID from payload: {user_id}, Role from payload: {user_role}") # Debug print
        if user_id is None or user_role is None:
            raise credentials_exception
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            print(f"Invalid UUID format for user_id: {user_id}") # Debug print
            raise credentials_exception
    except Exception as e:
        print(f"Token verification failed: {e}") # Debug print
        raise credentials_exception

    user = None
    if user_role == "admin":
        user = db.query(Admin).filter(Admin.admin_id == user_uuid).first()
    elif user_role == "doctor":
        user = db.query(Doctor).filter(Doctor.doctor_id == user_uuid).first()
    elif user_role == "patient":
        user = db.query(Patient).filter(Patient.patient_id == user_uuid).first()

    if user is None:
        print(f"User not found in DB for ID: {user_uuid} and role: {user_role}") # Debug print
        raise credentials_exception
    
    print(f"Successfully retrieved user: {user.name} with role: {user_role}") # Debug print
    return user, user_role
