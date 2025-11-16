from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict, Union
import uuid

from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate
from app.core.security import get_password_hash
from app.crud.base import CRUDBase


class CRUDPatient(CRUDBase[Patient, PatientCreate, PatientUpdate]):
    def get(self, db: Session, patient_id: uuid.UUID) -> Optional[Patient]:
        return db.query(self.model).filter(self.model.patient_id == patient_id).first()

    def get_by_card_number(self, db: Session, card_number: str) -> Optional[Patient]:
        return db.query(self.model).filter(self.model.card_number == card_number).first()

    def get_by_email(self, db: Session, email: str) -> Optional[Patient]:
        return db.query(self.model).filter(self.model.email == email).first()

    def create(self, db: Session, obj_in: PatientCreate) -> Patient:
        create_data = obj_in.dict()
        hashed_password = get_password_hash(create_data["password"])
        create_data["password_hash"] = hashed_password
        del create_data["password"]
        db_obj = self.model(**create_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Patient, obj_in: Union[PatientUpdate, Dict[str, Any]]) -> Patient:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        if "password" in update_data:
            update_data["password_hash"] = get_password_hash(update_data["password"])
            del update_data["password"]
        return super().update(db, db_obj=db_obj, obj_in=update_data)


patient_crud = CRUDPatient(Patient)
