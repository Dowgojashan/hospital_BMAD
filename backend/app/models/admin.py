import uuid
from sqlalchemy import Column, String, DateTime, Boolean, func
from sqlalchemy.dialects.postgresql import UUID

from ..db.base import Base


class Admin(Base):
    __tablename__ = "ADMIN"

    admin_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    account_username = Column(String, nullable=False, unique=True)
    password_hash = Column(String, nullable=False)
    is_system_account = Column(Boolean, nullable=False, default=False)
    is_system_admin = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<Admin {self.admin_id} {self.account_username}>"
