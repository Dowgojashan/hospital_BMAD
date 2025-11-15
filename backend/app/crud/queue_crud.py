from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from uuid import UUID

from ..models.room_day import RoomDay
from ..models.checkin import Checkin
from ..models.appointment import Appointment # Assuming Appointment model is needed for joining

class QueueCRUD:
    def __init__(self, db: Session):
        self.db = db

    def update_current_called_sequence(self, schedule_id: UUID, called_ticket_sequence: int) -> RoomDay:
        """
        Updates the current_called_sequence for a given schedule.
        If the RoomDay record does not exist, it creates one.
        """
        room_day = self.db.query(RoomDay).filter(
            RoomDay.schedule_id == schedule_id
        ).first()

        if room_day:
            room_day.current_called_sequence = called_ticket_sequence
        else:
            # If RoomDay doesn't exist, create it.
            room_day = RoomDay(
                schedule_id=schedule_id,
                next_sequence=1, # Default to 1, will be updated by check-in logic
                current_called_sequence=called_ticket_sequence
            )
            self.db.add(room_day)
        self.db.commit()
        self.db.refresh(room_day)
        return room_day

    def get_checkin_by_ticket_sequence(self, schedule_id: UUID, ticket_sequence: int) -> Checkin:
        """
        Retrieves a Checkin record for a given schedule and ticket sequence.
        """
        checkin = self.db.query(Checkin).join(Appointment).filter(
            Appointment.schedule_id == schedule_id,
            Checkin.ticket_sequence == ticket_sequence
        ).first()
        return checkin
