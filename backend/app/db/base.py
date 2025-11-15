from sqlalchemy.orm import declarative_base
from sqlalchemy.types import TypeDecorator, CHAR
import uuid

class UUIDType(TypeDecorator):
    """Platform-independent UUID type.

    Uses PostgreSQL's UUID type, otherwise uses
    CHAR(36), storing UUIDs as strings.
    """
    impl = CHAR(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        # If the value is already a UUID object, return it directly
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(value)

Base = declarative_base()

__all__ = ["Base", "UUIDType"]