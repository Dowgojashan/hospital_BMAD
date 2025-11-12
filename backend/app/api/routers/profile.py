from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Union
import uuid

from app.db.session import get_db
from app.core.security import verify_token
from app.models import Admin, Doctor, Patient
from app.schemas.profile import (
    PatientProfileUpdate,
    DoctorProfileUpdate,
    AdminProfileUpdate,
    PatientProfileResponse,
    DoctorProfileResponse,
    AdminProfileResponse,
)
from app.crud import crud_profile
from app.api.dependencies import get_current_active_user_with_role # Assuming this dependency exists or will be created


router = APIRouter()

# Helper to get current user and role (similar to get_current_active_admin but for all roles)
# This dependency needs to be robust enough to return the user object and their role
# For now, let's assume a dependency that returns a tuple (user_object, role_string)
# If get_current_active_user_with_role doesn't exist, it needs to be created in app.api.dependencies.py
# For simplicity, I'll assume it returns the actual model instance and a role string.


@router.get("/me", response_model=Union[AdminProfileResponse, DoctorProfileResponse, PatientProfileResponse])
def read_current_user_profile(
    current_user_with_role: tuple = Depends(get_current_active_user_with_role),
    db: Session = Depends(get_db),
):
    user, role = current_user_with_role
    print(f"read_current_user_profile: User: {user.name}, Role: {role}") # Debug print
    if role == "doctor":
        print(f"Debug: Doctor ORM object attributes - name: {user.name}, email: {user.email}, specialty: {user.specialty}, login_id: {user.doctor_login_id}")
        return DoctorProfileResponse.model_validate(user)
    elif role == "admin":
        return AdminProfileResponse.model_validate(user)
    elif role == "patient":
        return PatientProfileResponse.model_validate(user)
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown user role")


@router.put("/me", response_model=Union[AdminProfileResponse, DoctorProfileResponse, PatientProfileResponse])
def update_current_user_profile(
    profile_in: Union[PatientProfileUpdate, DoctorProfileUpdate, AdminProfileUpdate],
    current_user_with_role: tuple = Depends(get_current_active_user_with_role),
    db: Session = Depends(get_db),
):
    user, role = current_user_with_role
    user_id = user.admin_id if role == "admin" else user.doctor_id if role == "doctor" else user.patient_id

    updated_user = None
    if role == "admin":
        updated_user = crud_profile.update_admin_profile(db, user_id, profile_in)
    elif role == "doctor":
        updated_user = crud_profile.update_doctor_profile(db, user_id, profile_in)
    elif role == "patient":
        updated_user = crud_profile.update_patient_profile(db, user_id, profile_in)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown user role")

    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found or update failed")

    # Return the updated user with the correct response model
    if role == "admin":
        return AdminProfileResponse.model_validate(updated_user)
    elif role == "doctor":
        return DoctorProfileResponse.model_validate(updated_user)
    elif role == "patient":
        return PatientProfileResponse.model_validate(updated_user)
    
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to return updated profile")
