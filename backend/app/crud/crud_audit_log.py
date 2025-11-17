from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
import uuid

from app.models.audit_log import AuditLog
from app.models.admin import Admin
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.schemas.audit_log import AuditLogCreate, AuditLogPublic


def create_audit_log(db: Session, log_in: AuditLogCreate) -> AuditLog:
    db_log = AuditLog(**log_in.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


def get_audit_logs(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[AuditLogPublic]: # Change return type to List[AuditLogPublic]
    query = db.query(AuditLog)

    if user_id:
        query = query.filter(AuditLog.user_id.ilike(f"%{user_id}%"))
    if action:
        query = query.filter(AuditLog.action == action)
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)

    db_logs = query.order_by(desc(AuditLog.timestamp)).offset(skip).limit(limit).all()

    audit_logs_public = []
    for log in db_logs:
        user_name = None
        target_type = None

        # Determine user_name
        if log.user_id == "System":
            user_name = "System"
        else:
            # Try to find user in Admin, Doctor, Patient tables
            admin = db.query(Admin).filter(Admin.admin_id == log.user_id).first()
            if admin:
                user_name = f"{admin.name} (Admin)"
            else:
                doctor = db.query(Doctor).filter(Doctor.doctor_id == log.user_id).first()
                if doctor:
                    user_name = f"{doctor.name} (Doctor)"
                else:
                    patient = db.query(Patient).filter(Patient.patient_id == log.user_id).first()
                    if patient:
                        user_name = f"{patient.name} (Patient)"
                    else:
                        user_name = log.user_id # Fallback to user_id if not found

        # Determine target_type based on target_id prefix (heuristic)
        if log.target_id:
            if log.target_id.startswith("user"): # Assuming user IDs start with "user"
                target_type = "帳號"
            elif log.target_id.startswith("rec"): # Assuming medical record IDs start with "rec"
                target_type = "病歷"
            elif log.target_id.startswith("sch"): # Assuming schedule IDs start with "sch"
                target_type = "排程"
            elif log.target_id.startswith("app"): # Assuming appointment IDs start with "app"
                target_type = "預約"
            elif log.target_id.startswith("doc"): # Assuming doctor IDs start with "doc"
                target_type = "醫生"
            elif log.target_id.startswith("pat"): # Assuming patient IDs start with "pat"
                target_type = "病人"
            elif log.target_id.startswith("log"): # Assuming log IDs start with "log"
                target_type = "日誌"
            else:
                target_type = "未知" # Fallback for unknown target_id prefixes

        audit_logs_public.append(
            AuditLogPublic(
                log_id=log.log_id,
                user_id=log.user_id,
                action=log.action,
                timestamp=log.timestamp,
                target_id=log.target_id,
                log_metadata=log.log_metadata,
                user_name=user_name,
                target_type=target_type,
            )
        )
    return audit_logs_public
