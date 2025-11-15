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

    def update_current_called_sequence(self, room_id: UUID, current_date: date, called_ticket_sequence: int) -> RoomDay:
        """
        Updates the current_called_sequence for a given room and date.
        If the RoomDay record does not exist, it creates one.
        """
        room_day = self.db.query(RoomDay).filter(
            RoomDay.room_id == room_id,
            RoomDay.date == current_date
        ).first()

        if room_day:
            room_day.current_called_sequence = called_ticket_sequence
        else:
            # If RoomDay doesn't exist, create it.
            # This might happen if the first check-in of the day hasn't occurred yet,
            # or if the system is starting fresh.
            room_day = RoomDay(
                room_id=room_id,
                date=current_date,
                next_sequence=1, # Default to 1, will be updated by check-in logic
                current_called_sequence=called_ticket_sequence
            )
            self.db.add(room_day)
        self.db.commit()
        self.db.refresh(room_day)
        return room_day

    def get_checkin_by_ticket_sequence(self, room_id: UUID, current_date: date, ticket_sequence: int) -> Checkin:
        """
        Retrieves a Checkin record for a given room, date, and ticket sequence.
        """
        # Join with Appointment to filter by room_id
        checkin = self.db.query(Checkin).join(Appointment).filter(
            Appointment.doctor_id == room_id, # Assuming room_id is doctor_id
            func.date(Checkin.checkin_time) == current_date, # Assuming checkin_time stores date and time
            Checkin.ticket_sequence == ticket_sequence
        ).first()
        return checkin