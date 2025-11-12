from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text # Import text


# revision identifiers, used by Alembic.
revision: str = 'ca753a48f083'
down_revision: Union[str, Sequence[str], None] = 'a5a33567d8e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        text(
            """
            UPDATE "SCHEDULE"
            SET time_period = CASE time_period
                WHEN '上午診' THEN 'morning'
                WHEN '下午診' THEN 'afternoon'
                WHEN '夜間診' THEN 'night'
                ELSE time_period
            END
            """
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        text(
            """
            UPDATE "SCHEDULE"
            SET time_period = CASE time_period
                WHEN 'morning' THEN '上午診'
                WHEN 'afternoon' THEN '下午診'
                WHEN 'night' THEN '夜間診'
                ELSE time_period
            END
            """
        )
    )
