import uuid
from sqlalchemy import Column, String, Date, DateTime, func
from sqlalchemy.dialects.postgresql import UUID

from ..db.base import Base


class Patient(Base):
    __tablename__ = "PATIENT"

    patient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_number = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    dob = Column(Date, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    suspended_until = Column(Date, nullable=True)

    def __repr__(self):
        return f"<Patient {self.patient_id} {self.card_number} {self.name}>"
