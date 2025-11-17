import uuid
from sqlalchemy import Column, Date, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..db.base import Base, UUIDType


class RoomDay(Base):
    __tablename__ = "ROOM_DAY"

    room_day_id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    schedule_id = Column(UUIDType, ForeignKey("SCHEDULE.schedule_id"), nullable=False, unique=True)
    next_sequence = Column(Integer, nullable=False, default=1)
    current_called_sequence = Column(Integer, nullable=True)

    schedule = relationship("Schedule")

    def __repr__(self):
        return f"<RoomDay {self.room_day_id} schedule={self.schedule_id} next={self.next_sequence}>"