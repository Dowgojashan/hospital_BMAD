import uuid
from sqlalchemy import Column, String, DateTime, func, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB

from ..db.base import Base


class AuditLog(Base):
    __tablename__ = "AUDIT_LOG"

    log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False)
    action = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    target_id = Column(String, nullable=True)
    log_metadata = Column(Text, nullable=True)

    def __repr__(self):
        return f"<AuditLog {self.log_id} action={self.action} user={self.user_id}>"
