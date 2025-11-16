from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict, Union
import uuid

from app.models.medical_record import MedicalRecord
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordUpdate
from app.crud.base import CRUDBase


class CRUDMedicalRecord(CRUDBase[MedicalRecord, MedicalRecordCreate, MedicalRecordUpdate]):
    def get(self, db: Session, record_id: uuid.UUID) -> Optional[MedicalRecord]:
        return db.query(self.model).filter(self.model.record_id == record_id).first()

    def get_multi_by_patient(
        self, db: Session, patient_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> List[MedicalRecord]:
        return (
            db.query(self.model)
            .filter(self.model.patient_id == patient_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_multi_by_doctor(
        self, db: Session, doctor_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> List[MedicalRecord]:
        return (
            db.query(self.model)
            .filter(self.model.doctor_id == doctor_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create(self, db: Session, obj_in: MedicalRecordCreate) -> MedicalRecord:
        create_data = obj_in.dict()
        db_obj = self.model(**create_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, db_obj: MedicalRecord, obj_in: Union[MedicalRecordUpdate, Dict[str, Any]]
    ) -> MedicalRecord:
        return super().update(db, db_obj=db_obj, obj_in=obj_in)


medical_record_crud = CRUDMedicalRecord(MedicalRecord)
