"""insert default admin user

Revision ID: 4fc489a0bf19
Revises: 26bb1b0064c2
Create Date: 2025-11-15 13:38:23.937123

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4fc489a0bf19'
down_revision: Union[str, Sequence[str], None] = '26bb1b0064c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    from uuid import uuid4
    import bcrypt
    from datetime import datetime

    admin_id = uuid4()
    password = "admin123"
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    op.execute(
        sa.text(
            """
            INSERT INTO "ADMIN" (admin_id, name, email, account_username, password_hash, is_system_account, is_system_admin, created_at)
            VALUES (:admin_id, :name, :email, :account_username, :password_hash, :is_system_account, :is_system_admin, :created_at)
            """
        ).bindparams(
            admin_id=str(admin_id),
            name="System Admin",
            email="admin@example.com",
            account_username="admin",
            password_hash=hashed_password,
            is_system_account=True,
            is_system_admin=True,
            created_at=datetime.now()
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        sa.text(
            """
            DELETE FROM "ADMIN" WHERE account_username = 'admin'
            """
        )
    )