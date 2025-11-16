from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.dependencies import get_current_active_doctor
from app.models.doctor import Doctor
from app.crud.crud_medical_record import medical_record as crud_medical_record
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordPublic, MedicalRecordUpdate

router = APIRouter()

@router.post("/records", response_model=MedicalRecordPublic, status_code=status.HTTP_201_CREATED)
async def create_medical_record(
    medical_record_in: MedicalRecordCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """
    允許已授權的醫生為病患創建新的病歷記錄。
    """
    # 確保 doctor_id 來自當前登入的醫生
    if medical_record_in.doctor_id != current_doctor.doctor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您無權為其他醫生創建病歷。"
        )
    
    # 可以在此處添加額外的驗證，例如 patient_id 或 appointment_id 是否存在
    # For now, we assume they are valid UUIDs as per schema validation

    try:
        new_medical_record = crud_medical_record.create(db, obj_in=medical_record_in)
        return new_medical_record
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"創建病歷失敗: {e}"
        )

@router.put("/records/{record_id}", response_model=MedicalRecordPublic)
async def update_medical_record(
    record_id: UUID,
    medical_record_in: MedicalRecordUpdate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """
    允許已授權的醫生更新現有的病歷記錄。
    """
    medical_record = crud_medical_record.get(db, record_id=record_id)
    if not medical_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="病歷記錄未找到。"
        )
    
    # 檢查是否為創建該病歷的醫生
    if medical_record.doctor_id != current_doctor.doctor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您無權修改此病歷記錄。"
        )
    
    try:
        updated_medical_record = crud_medical_record.update(db, db_obj=medical_record, obj_in=medical_record_in)
        return updated_medical_record
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新病歷失敗: {e}"
        )