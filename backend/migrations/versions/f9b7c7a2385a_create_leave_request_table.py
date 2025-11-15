"""create leave_request table

Revision ID: f9b7c7a2385a
Revises: 4fc489a0bf19
Create Date: 2025-11-15 13:52:52.134005

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.types import TypeDecorator, CHAR
import uuid


class UUIDType(TypeDecorator):
    """Platform-independent UUID type.

    Uses PostgreSQL's UUID type, otherwise uses
    CHAR(36), storing UUIDs as strings.
    """
    impl = CHAR(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(postgresql.UUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(value))
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return uuid.UUID(value)


# revision identifiers, used by Alembic.
revision: str = 'f9b7c7a2385a'
down_revision: Union[str, Sequence[str], None] = '4fc489a0bf19'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    from sqlalchemy import func

    op.create_table('LEAVE_REQUEST',
    sa.Column('leave_request_id', UUIDType(), nullable=False),
    sa.Column('schedule_id', UUIDType(), nullable=False),
    sa.Column('doctor_id', UUIDType(), nullable=False),
    sa.Column('reason', sa.Text(), nullable=False),
    sa.Column('requested_at', sa.DateTime(timezone=True), server_default=func.now(), nullable=False),
    sa.ForeignKeyConstraint(['doctor_id'], ['DOCTOR.doctor_id'], ),
    sa.ForeignKeyConstraint(['schedule_id'], ['SCHEDULE.schedule_id'], ),
    sa.PrimaryKeyConstraint('leave_request_id'),
    sa.UniqueConstraint('schedule_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('LEAVE_REQUEST')
