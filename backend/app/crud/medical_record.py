import logging
from sqlalchemy.orm import Session, joinedload
from typing import Dict, Any, Optional
import uuid

from ..models.medical_record import MedicalRecord
from ..schemas.medical_record import MedicalRecordCreate, MedicalRecordUpdate

logger = logging.getLogger(__name__)

def get_medical_record(db: Session, record_id: uuid.UUID):
    return db.query(MedicalRecord).filter(MedicalRecord.record_id == record_id).first()

def get_medical_records_by_doctor(db: Session, doctor_id: uuid.UUID, patient_id: Optional[uuid.UUID] = None, skip: int = 0, limit: int = 100):
    query = db.query(MedicalRecord).filter(MedicalRecord.doctor_id == doctor_id)
    if patient_id:
        query = query.filter(MedicalRecord.patient_id == patient_id)
    
    # Eagerly load the doctor and patient relationships to avoid separate queries
    query = query.options(joinedload(MedicalRecord.doctor), joinedload(MedicalRecord.patient))
    
    return query.order_by(MedicalRecord.created_at.desc()).offset(skip).limit(limit).all()

def get_medical_records_by_patient(db: Session, patient_id: uuid.UUID, department: Optional[str] = None, skip: int = 0, limit: int = 100):
    query = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient_id)
    if department:
        query = query.filter(MedicalRecord.department == department)
    query = query.options(joinedload(MedicalRecord.doctor), joinedload(MedicalRecord.patient))
    return query.order_by(MedicalRecord.created_at.desc()).offset(skip).limit(limit).all()

def create_medical_record(db: Session, medical_record: Dict[str, Any]):
    logger.info(f"CRUD: Received medical record data for creation: {medical_record}")
    db_medical_record = MedicalRecord(**medical_record)
    db.add(db_medical_record)
    db.commit()
    db.refresh(db_medical_record)
    logger.info(f"CRUD: Successfully created medical record with ID: {db_medical_record.record_id}")
    return db_medical_record

def update_medical_record(db: Session, db_medical_record: MedicalRecord, medical_record: MedicalRecordUpdate):
    update_data = medical_record.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_medical_record, key, value)
    db.add(db_medical_record)
    db.commit()
    db.refresh(db_medical_record)
    return db_medical_record

def delete_medical_record(db: Session, record_id: uuid.UUID):
    db_medical_record = db.query(MedicalRecord).filter(MedicalRecord.record_id == record_id).first()
    if db_medical_record:
        db.delete(db_medical_record)
        db.commit()
    return db_medical_record
