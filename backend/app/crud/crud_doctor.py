from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict, Union
import uuid

from app.models.doctor import Doctor
from app.schemas.doctor import DoctorCreate, DoctorUpdate
from app.core.security import get_password_hash
from app.crud.base import CRUDBase


class CRUDDoctor(CRUDBase[Doctor, DoctorCreate, DoctorUpdate]):
    def get(self, db: Session, doctor_id: uuid.UUID) -> Optional[Doctor]:
        return db.query(self.model).filter(self.model.doctor_id == doctor_id).first()

    def get_by_login_id(self, db: Session, doctor_login_id: str) -> Optional[Doctor]:
        return db.query(self.model).filter(self.model.doctor_login_id == doctor_login_id).first()

    def create(self, db: Session, obj_in: DoctorCreate) -> Doctor:
        create_data = obj_in.dict()
        hashed_password = get_password_hash(create_data["password"])
        create_data["password_hash"] = hashed_password
        del create_data["password"]
        db_obj = self.model(**create_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Doctor, obj_in: Union[DoctorUpdate, Dict[str, Any]]) -> Doctor:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        if "password" in update_data:
            update_data["password_hash"] = get_password_hash(update_data["password"])
            del update_data["password"]
        return super().update(db, db_obj=db_obj, obj_in=update_data)


doctor_crud = CRUDDoctor(Doctor)
