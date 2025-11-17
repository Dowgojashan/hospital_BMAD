import uuid
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.orm import relationship

from ..db.base import Base, UUIDType


class Doctor(Base):
    __tablename__ = "DOCTOR"

    doctor_id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    doctor_login_id = Column(String, nullable=False, unique=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    specialty = Column(String, nullable=False)
    email = Column(String, nullable=True, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    appointments = relationship("Appointment", back_populates="doctor")
    medical_records = relationship("MedicalRecord", back_populates="doctor")

    def __repr__(self):
        return f"<Doctor {self.doctor_id} {self.name}>"
