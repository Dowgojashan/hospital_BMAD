from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.db.session import get_db
from app.core.security import verify_token
from app.models.admin import Admin
from app.models.doctor import Doctor
from app.models.patient import Patient # Import Patient model
from app.schemas.admin import AdminCreate, AdminUpdate, AdminPublic
from app.schemas.doctor import DoctorCreate, DoctorUpdate, DoctorPublic
from app.schemas.patient import PatientCreate, PatientUpdate, PatientPublic # Import Patient schemas
from app.crud import crud_admin, crud_doctor, crud_user, crud_schedule, crud_leave_request
from app.schemas.admin import AdminCreate, AdminUpdate, AdminPublic
from app.schemas.doctor import DoctorCreate, DoctorUpdate, DoctorPublic
from app.schemas.patient import PatientCreate, PatientUpdate, PatientPublic # Import Patient schemas

from app.schemas.dashboard import DashboardStats # Import DashboardStats
from app.services.dashboard_service import get_admin_dashboard_stats # Import dashboard service

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


async def get_current_active_admin(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> Admin:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = verify_token(token)
        user_id: str = payload.get("sub")
        user_role: str = payload.get("role")
        if user_id is None or user_role != "admin":
            raise credentials_exception
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    admin = db.query(Admin).filter(Admin.admin_id == user_uuid).first()
    if admin is None:
        raise credentials_exception
    return admin


# Admin Dashboard Endpoints
@router.get("/admin/dashboard-stats", response_model=DashboardStats)
def get_dashboard_stats_endpoint(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    """
    Retrieve administrative dashboard statistics.
    """
    stats = get_admin_dashboard_stats(db=db)
    return stats




# Admin Management Endpoints
@router.post("/admins/", response_model=AdminPublic, status_code=status.HTTP_201_CREATED)
def create_admin_endpoint(
    admin_in: AdminCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    db_admin = crud_admin.create_admin(db=db, admin_in=admin_in)
    return db_admin


@router.get("/admins/", response_model=List[AdminPublic])
def list_admins_endpoint(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    admins = crud_admin.list_admins(db=db, skip=skip, limit=limit)
    return admins


@router.get("/admins/{admin_id}", response_model=AdminPublic)
def get_admin_endpoint(
    admin_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    admin = crud_admin.get_admin(db=db, admin_id=admin_id)
    if not admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")
    return admin


@router.put("/admins/{admin_id}", response_model=AdminPublic)
def update_admin_endpoint(
    admin_id: uuid.UUID,
    admin_in: AdminUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    admin = crud_admin.update_admin(db=db, admin_id=admin_id, admin_in=admin_in)
    if not admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")
    return admin


@router.delete("/admins/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_endpoint(
    admin_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    admin_to_delete = crud_admin.get_admin(db=db, admin_id=admin_id)
    if not admin_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")

    if str(current_admin.admin_id) == str(admin_to_delete.admin_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="您不能刪除自己的帳號")

    if admin_to_delete.is_system_admin and (not current_admin.is_system_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="權限不足：一般管理員不能刪除系統管理員")

    crud_admin.delete_admin(db=db, admin_id=admin_id)
    return


# Doctor Management Endpoints
@router.post("/doctors/", response_model=DoctorPublic, status_code=status.HTTP_201_CREATED)
def create_doctor_endpoint(
    doctor_in: DoctorCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    db_doctor = crud_doctor.create_doctor(db=db, doctor_in=doctor_in)
    return db_doctor


@router.get("/doctors/", response_model=List[DoctorPublic])
def list_doctors_endpoint(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    doctors = crud_doctor.list_doctors(db=db, skip=skip, limit=limit)
    return doctors


@router.get("/doctors/{doctor_id}", response_model=DoctorPublic)
def get_doctor_endpoint(
    doctor_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    doctor = crud_doctor.get_doctor(db=db, doctor_id=doctor_id)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return doctor


@router.put("/doctors/{doctor_id}", response_model=DoctorPublic)
def update_doctor_endpoint(
    doctor_id: uuid.UUID,
    doctor_in: DoctorUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    doctor = crud_doctor.update_doctor(db=db, doctor_id=doctor_id, doctor_in=doctor_in)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return doctor


@router.delete("/doctors/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_doctor_endpoint(
    doctor_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    doctor = crud_doctor.delete_doctor(db=db, doctor_id=doctor_id)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return


# Patient Management Endpoints
@router.post("/patients/", response_model=PatientPublic, status_code=status.HTTP_201_CREATED)
def create_patient_endpoint(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    db_patient = crud_user.create_patient(db=db, patient_in=patient_in)
    return db_patient


@router.get("/patients/", response_model=List[PatientPublic])
def list_patients_endpoint(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    patients = crud_user.list_patients(db=db, skip=skip, limit=limit)
    return patients


@router.get("/patients/{patient_id}", response_model=PatientPublic)
def get_patient_endpoint(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    patient = crud_user.get_patient(db=db, patient_id=patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


@router.put("/patients/{patient_id}", response_model=PatientPublic)
def update_patient_endpoint(
    patient_id: uuid.UUID,
    patient_in: PatientUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    patient = crud_user.update_patient(db=db, patient_id=patient_id, patient_in=patient_in)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


@router.delete("/patients/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient_endpoint(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    patient = crud_user.delete_patient(db=db, patient_id=patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return


@router.get("/leave-requests", response_model=List[dict]) # Assuming a dict response for now
def list_leave_requests_endpoint(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    """
    List all pending leave requests for admin management.
    """
    leave_requests = crud_schedule.list_pending_leave_requests(db)
    return leave_requests


@router.put("/leave-requests/{schedule_id}/approve", status_code=status.HTTP_200_OK)
def approve_leave_request_endpoint(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    """
    Admin approves a leave request.
    """
    crud_leave_request.approve_leave_request(db, schedule_id=schedule_id)
    return {"message": "停診申請已核准。"}


@router.put("/leave-requests/{schedule_id}/reject", status_code=status.HTTP_200_OK)
def reject_leave_request_endpoint(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin),
):
    """
    Admin rejects a leave request.
    """
    crud_leave_request.reject_leave_request(db, schedule_id=schedule_id)
    return {"message": "停診申請已拒絕。"}
