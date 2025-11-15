"""refactor_room_day_to_use_schedule_id

Revision ID: 83d7f9d02a14
Revises: c8b64dd25c82
Create Date: 2025-11-15 12:51:16.417566

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '83d7f9d02a14'
down_revision: Union[str, Sequence[str], None] = 'c8b64dd25c82'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Since we are changing the structure of ROOM_DAY, we'll drop existing data.
    op.execute('TRUNCATE "ROOM_DAY" CASCADE')
    op.add_column('ROOM_DAY', sa.Column('schedule_id', sa.UUID(), nullable=False))
    op.create_unique_constraint('uq_room_day_schedule_id', 'ROOM_DAY', ['schedule_id'])
    op.create_foreign_key('fk_room_day_schedule_id', 'ROOM_DAY', 'SCHEDULE', ['schedule_id'], ['schedule_id'])
    op.drop_column('ROOM_DAY', 'room_id')
    op.drop_column('ROOM_DAY', 'date')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('ROOM_DAY', sa.Column('date', sa.DATE(), autoincrement=False, nullable=False))
    op.add_column('ROOM_DAY', sa.Column('room_id', sa.UUID(), autoincrement=False, nullable=False))
    op.drop_constraint('fk_room_day_schedule_id', 'ROOM_DAY', type_='foreignkey')
    op.drop_constraint('uq_room_day_schedule_id', 'ROOM_DAY', type_='unique')
    op.drop_column('ROOM_DAY', 'schedule_id')