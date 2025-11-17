import os
import sys
import logging
from sqlalchemy.orm import Session

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.models.admin import Admin
from app.core.security import get_password_hash
from app.db.session import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_super_admin():
    db: Session = SessionLocal()
    try:
        # Check if super admin already exists
        existing_admin = db.query(Admin).filter(Admin.account_username == "admin").first()

        if existing_admin:
            logger.info("Super admin 'admin' already exists.")
        else:
            # Hash the password
            hashed_password = get_password_hash("admin123")

            # Create new Admin object
            super_admin = Admin(
                account_username="admin",
                password_hash=hashed_password,
                name="Super Admin",
                email="sysadmin@hospital.dev",
                is_system_admin=True
            )

            # Add to database and commit
            db.add(super_admin)
            db.commit()
            db.refresh(super_admin)
            logger.info("Super admin 'admin' created successfully.")
    except Exception as e:
        logger.error(f"Error seeding super admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_super_admin()
