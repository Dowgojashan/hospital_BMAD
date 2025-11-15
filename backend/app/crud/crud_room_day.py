from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid
from datetime import date

from app.models.room_day import RoomDay
from app.schemas.room_day import RoomDayCreate, RoomDayUpdate

class CRUDRoomDay:
    def get_by_room_id_and_date(self, db: Session, *, room_id: uuid.UUID, date: date) -> RoomDay | None:
        return db.query(RoomDay).filter(RoomDay.room_id == room_id, RoomDay.date == date).first()

    def create(self, db: Session, *, obj_in: RoomDayCreate) -> RoomDay:
        db_obj = RoomDay(
            room_day_id=uuid.uuid4(),
            room_id=obj_in.room_id,
            date=obj_in.date,
            next_sequence=obj_in.next_sequence if obj_in.next_sequence is not None else 1,
            current_called_sequence=obj_in.current_called_sequence
        )
        db.add(db_obj)
        db.flush()
        db.refresh(db_obj)
        return db_obj

    def update_next_sequence(self, db: Session, *, db_obj: RoomDay) -> RoomDay:
        # Atomically increment next_sequence using a database-level operation
        # This is crucial for concurrency control
        db_obj.next_sequence = RoomDay.next_sequence + 1
        db.add(db_obj)
        db.flush()
        db.refresh(db_obj)
        return db_obj

    def get_room_day_for_update(self, db: Session, *, room_id: uuid.UUID, date: date) -> RoomDay | None:
        # Use SELECT ... FOR UPDATE to lock the row for atomic updates
        return db.query(RoomDay).filter(RoomDay.room_id == room_id, RoomDay.date == date).with_for_update().first()

room_day = CRUDRoomDay()
