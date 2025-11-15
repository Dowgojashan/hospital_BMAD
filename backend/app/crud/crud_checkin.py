from sqlalchemy.orm import Session
import uuid
from datetime import datetime
from typing import List

from app.models.checkin import Checkin
from app.models.appointment import Appointment # Import Appointment model
from app.schemas.checkin import CheckinCreate

class CRUDCheckin:
    def create(self, db: Session, *, obj_in: CheckinCreate) -> Checkin:
        db_obj = Checkin(
            checkin_id=uuid.uuid4(),
            appointment_id=obj_in.appointment_id,
            patient_id=obj_in.patient_id,
            checkin_time=obj_in.checkin_time if obj_in.checkin_time else datetime.now(),
            checkin_method=obj_in.checkin_method,
            ticket_sequence=obj_in.ticket_sequence,
            ticket_number=obj_in.ticket_number,
            cancelled_by=obj_in.cancelled_by,
            cancel_reason=obj_in.cancel_reason
        )
        db.add(db_obj)
        db.flush()
        db.refresh(db_obj)
        return db_obj

    def get_checked_in_patients_for_schedule(self, db: Session, schedule_id: uuid.UUID) -> List[Checkin]:
        # 查詢所有與該 schedule_id 相關的已報到病患
        # 需要聯結 Appointment 表來篩選 schedule_id
        return db.query(Checkin).join(Appointment).filter(
            Appointment.schedule_id == schedule_id
        ).order_by(Checkin.ticket_sequence.asc()).all()

checkin = CRUDCheckin()
