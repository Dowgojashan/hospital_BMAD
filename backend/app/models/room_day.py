import uuid
from sqlalchemy import Column, Date, Integer
from ..db.base import Base, UUIDType


class RoomDay(Base):
    __tablename__ = "ROOM_DAY"

    room_day_id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    room_id = Column(UUIDType, nullable=False)
    date = Column(Date, nullable=False)
    next_sequence = Column(Integer, nullable=False, default=1)
    current_called_sequence = Column(Integer, nullable=True)

    def __repr__(self):
        return f"<RoomDay {self.room_day_id} room={self.room_id} date={self.date} next={self.next_sequence}>"
