import uuid
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Enum, func
from sqlalchemy.dialects.postgresql import UUID

from ..db.base import Base


call_type_enum = ("call", "recall", "skip")
call_status_enum = ("active", "expired", "attended")


class VisitCall(Base):
    __tablename__ = "VISIT_CALL"

    call_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("APPOINTMENT.appointment_id"), nullable=True)
    ticket_sequence = Column(Integer, nullable=False)
    ticket_number = Column(String, nullable=True)
    called_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    called_by = Column(UUID(as_uuid=True), ForeignKey("ADMIN.admin_id"), nullable=True)
    call_type = Column(Enum(*call_type_enum, name="call_type"), nullable=False)
    call_status = Column(Enum(*call_status_enum, name="call_status"), nullable=False)

    def __repr__(self):
        return f"<VisitCall {self.call_id} seq={self.ticket_sequence} at={self.called_at}>"
