from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import date, datetime, time
import pytz # Import pytz

from app.models.infraction import Infraction
from app.schemas.infraction import InfractionCreate, InfractionUpdate # Assuming these schemas exist

class InfractionCRUD:
    def __init__(self, db: Session):
        self.db = db

    def create(self, obj_in: InfractionCreate) -> Infraction:
        taiwan_tz = pytz.timezone('Asia/Taipei')
        now_in_taiwan = datetime.now(taiwan_tz)
        db_obj = Infraction(
            patient_id=obj_in.patient_id,
            appointment_id=obj_in.appointment_id,
            infraction_type=obj_in.infraction_type,
            occurred_at=now_in_taiwan,
            penalty_applied=False,
            penalty_until=None,
            notes=obj_in.notes
        )
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def get(self, infraction_id: uuid.UUID) -> Optional[Infraction]:
        return self.db.query(Infraction).filter(Infraction.infraction_id == infraction_id).first()

    def count_infractions_by_patient_and_type(self, patient_id: uuid.UUID, infraction_type: str) -> int:
        return self.db.query(Infraction).filter(
            Infraction.patient_id == patient_id,
            Infraction.infraction_type == infraction_type,
            Infraction.penalty_applied == False # Only count infractions that haven't resulted in a penalty yet
        ).count()

    def update_penalty_status(self, infraction_id: uuid.UUID, penalty_applied: bool, penalty_until: Optional[date]) -> Optional[Infraction]:
        db_obj = self.db.query(Infraction).filter(Infraction.infraction_id == infraction_id).first()
        if db_obj:
            db_obj.penalty_applied = penalty_applied
            db_obj.penalty_until = penalty_until
            self.db.add(db_obj)
            self.db.commit()
            self.db.refresh(db_obj)
        return db_obj

    def get_all_by_patient(self, patient_id: uuid.UUID) -> List[Infraction]:
        return self.db.query(Infraction).filter(Infraction.patient_id == patient_id).all()

    def count_infractions_in_period(self, patient_id: uuid.UUID, infraction_type: str, start_date: date, end_date: date) -> int:
        taiwan_tz = pytz.timezone('Asia/Taipei')
        start_datetime = taiwan_tz.localize(datetime.combine(start_date, time.min))
        end_datetime = taiwan_tz.localize(datetime.combine(end_date, time.max)) # time.max for end of day

        return self.db.query(Infraction).filter(
            Infraction.patient_id == patient_id,
            Infraction.infraction_type == infraction_type,
            Infraction.occurred_at >= start_datetime,
            Infraction.occurred_at <= end_datetime
        ).count()

infraction_crud = InfractionCRUD(None) # Placeholder, will be initialized with db session in service
