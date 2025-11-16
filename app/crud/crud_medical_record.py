from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.medical_record import MedicalRecord
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordUpdate

class CRUDMedicalRecord:
    def create(self, db: Session, *, obj_in: MedicalRecordCreate) -> MedicalRecord:
        db_obj = MedicalRecord(
            patient_id=obj_in.patient_id,
            doctor_id=obj_in.doctor_id,
            appointment_id=obj_in.appointment_id,
            summary=obj_in.summary,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get(self, db: Session, record_id: UUID) -> Optional[MedicalRecord]:
        return db.query(MedicalRecord).filter(MedicalRecord.record_id == record_id).first()

    def get_multi_by_patient(
        self, db: Session, patient_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[MedicalRecord]:
        return (
            db.query(MedicalRecord)
            .filter(MedicalRecord.patient_id == patient_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_multi_by_doctor(
        self, db: Session, doctor_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[MedicalRecord]:
        return (
            db.query(MedicalRecord)
            .filter(MedicalRecord.doctor_id == doctor_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update(
        self, db: Session, *, db_obj: MedicalRecord, obj_in: MedicalRecordUpdate
    ) -> MedicalRecord:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, record_id: UUID) -> Optional[MedicalRecord]:
        obj = db.query(MedicalRecord).filter(MedicalRecord.record_id == record_id).first()
        if obj:
            db.delete(obj)
            db.commit()
        return obj

medical_record = CRUDMedicalRecord()
