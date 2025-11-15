"""add schedule_id to appointment

Revision ID: c8b64dd25c82
Revises: a4360ca17d12
Create Date: 2025-11-15 12:41:14.215548

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c8b64dd25c82'
down_revision: Union[str, Sequence[str], None] = 'a4360ca17d12'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('appointment', sa.Column('schedule_id', sa.UUID(), nullable=True))
    op.execute("""
        UPDATE appointment
        SET schedule_id = T2.schedule_id
        FROM "SCHEDULE" AS T2
        WHERE appointment.date = T2.date
        AND appointment.time_period = T2.time_period
        AND appointment.doctor_id = T2.doctor_id
    """)
    op.execute('DELETE FROM appointment WHERE schedule_id IS NULL')
    op.alter_column('appointment', 'schedule_id', nullable=False)
    op.create_foreign_key('fk_appointment_schedule_id', 'appointment', 'SCHEDULE', ['schedule_id'], ['schedule_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_appointment_schedule_id', 'appointment', type_='foreignkey')
    op.drop_column('appointment', 'schedule_id')