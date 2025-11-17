from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from uuid import UUID

from app.models.visit_call import VisitCall
from app.models.appointment import Appointment

class VisitCallCRUD:
    def __init__(self, db: Session):
        self.db = db

    def get_potential_no_shows(self, no_show_threshold: datetime) -> List[VisitCall]:
        """
        Retrieves VisitCall records for appointments that were called before the no_show_threshold
        and are still in a 'checked_in' or 'waiting' status.
        """
        return self.db.query(VisitCall).join(Appointment).filter(
            VisitCall.called_at < no_show_threshold,
            VisitCall.call_status == "active", # Assuming 'active' means it's still in the queue
            Appointment.status.in_(["checked_in", "waiting"])
        ).all()

    def create_visit_call(self, db: Session, appointment_id: UUID, ticket_sequence: int, ticket_number: str, called_by: UUID, call_type: str, call_status: str) -> VisitCall:
        """
        Creates a new VisitCall record.
        """
        db_obj = VisitCall(
            appointment_id=appointment_id,
            ticket_sequence=ticket_sequence,
            ticket_number=ticket_number,
            called_by=called_by,
            call_type=call_type,
            call_status=call_status
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
