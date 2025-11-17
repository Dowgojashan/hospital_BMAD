import logging
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid

from app.models import Admin
from app.schemas.admin import AdminCreate, AdminUpdate # Assuming you have an AdminCreate schema
from app.core import security

logger = logging.getLogger(__name__)

def create_admin(
    db: Session,
    admin_in: AdminCreate,
    is_system_account: bool = False,
    is_system_admin: bool = False
) -> Admin:
    logger.info("create_admin: start")

    hashed_password = security.get_password_hash(admin_in.password)
    db_obj = Admin(
        admin_id=uuid.uuid4(),
        name=admin_in.name,
        email=admin_in.email,
        account_username=admin_in.account_username,
        password_hash=hashed_password,
        is_system_account=is_system_account,
        is_system_admin=is_system_admin,
        department=admin_in.department, # Add department
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    logger.info("create_admin: end")
    return db_obj

def get_admin_by_username(db: Session, username: str) -> Optional[Admin]:
    return db.query(Admin).filter(Admin.account_username == username).first()

def get_admin_by_id(db: Session, admin_id: uuid.UUID) -> Optional[Admin]:
    return db.query(Admin).filter(Admin.admin_id == admin_id).first()

def update_admin(db: Session, admin_id: uuid.UUID, admin_in: AdminUpdate) -> Optional[Admin]:
    db_admin = db.query(Admin).filter(Admin.admin_id == admin_id).first()
    if not db_admin:
        return None

    update_data = admin_in.dict(exclude_unset=True)

    if "password" in update_data and update_data["password"]:
        db_admin.password_hash = security.get_password_hash(update_data["password"])
        del update_data["password"]

    for field, value in update_data.items():
        setattr(db_admin, field, value)

    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

def list_admins(db: Session, skip: int = 0, limit: int = 100) -> List[Admin]:
    return db.query(Admin).offset(skip).limit(limit).all()

def delete_admin(db: Session, admin_id: uuid.UUID) -> Optional[Admin]:
    db_admin = db.query(Admin).filter(Admin.admin_id == admin_id).first()
    if not db_admin:
        return None
    db.delete(db_admin)
    db.commit()
    return db_admin