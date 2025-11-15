from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Union
from pydantic import ValidationError # Import ValidationError

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.schemas.patient import PatientPublic, PatientUpdate
from app.schemas.doctor import DoctorPublic, DoctorUpdate
from app.schemas.admin import AdminPublic, AdminUpdate
from app.crud import crud_user, crud_doctor, crud_admin # Import CRUD functions

router = APIRouter()

@router.get("/me", response_model=Union[PatientPublic, DoctorPublic, AdminPublic])
async def read_users_me(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    獲取當前登錄用戶的個人資料。
    """
    user_obj = current_user["user_obj"]
    user_role = current_user["role"]

    if user_role == "patient":
        return PatientPublic.model_validate(user_obj)
    elif user_role == "doctor":
        return DoctorPublic.model_validate(user_obj)
    elif user_role == "admin":
        return AdminPublic.model_validate(user_obj)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown user role.")

@router.put("/me", response_model=Union[PatientPublic, DoctorPublic, AdminPublic])
async def update_users_me(
    payload: dict, # 接收原始字典，然後手動解析
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    更新當前登錄用戶的個人資料。
    """
    user_obj = current_user["user_obj"]
    user_role = current_user["role"]
    user_id = current_user["user_id"]

    try:
        if user_role == "patient":
            update_data = PatientUpdate.model_validate(payload)
            updated_user = crud_user.update_patient(db, patient_id=user_id, patient_in=update_data)
            return PatientPublic.model_validate(updated_user)
        elif user_role == "doctor":
            update_data = DoctorUpdate.model_validate(payload)
            updated_user = crud_doctor.update_doctor(db, doctor_id=user_id, doctor_in=update_data)
            return DoctorPublic.model_validate(updated_user)
        elif user_role == "admin":
            update_data = AdminUpdate.model_validate(payload)
            updated_user = crud_admin.update_admin(db, admin_id=user_id, admin_in=update_data)
            return AdminPublic.model_validate(updated_user)
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown user role.")
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Payload validation error: {e.errors()}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update profile: {e}")
