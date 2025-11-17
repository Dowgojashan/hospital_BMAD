from sqlalchemy.orm import Session
from typing import Optional, List
import uuid

from ..models.patient import Patient



def get_patient(db: Session, patient_id: uuid.UUID):
    return db.query(Patient).filter(Patient.patient_id == patient_id).first()

def get_patient_by_name_and_email(db: Session, patient_name: str, patient_email: Optional[str] = None) -> List[Patient]:
    query = db.query(Patient).filter(Patient.name == patient_name)
    if patient_email:
        query = query.filter(Patient.email == patient_email)
    return query.all()
