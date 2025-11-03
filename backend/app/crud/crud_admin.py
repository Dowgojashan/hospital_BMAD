from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.models.admin import Admin
from app.schemas.admin import AdminCreate, AdminUpdate
from app.core.security import get_password_hash


def get_admin(db: Session, admin_id: uuid.UUID) -> Optional[Admin]:
    return db.query(Admin).filter(Admin.admin_id == admin_id).first()


def list_admins(db: Session, skip: int = 0, limit: int = 100) -> List[Admin]:
    return db.query(Admin).offset(skip).limit(limit).all()


def create_admin(db: Session, admin_in: AdminCreate) -> Admin:
    hashed_password = get_password_hash(admin_in.password)
    db_admin = Admin(
        account_username=admin_in.account_username,
        password_hash=hashed_password,
        name=admin_in.name,
        email=admin_in.email,
        is_system_account=admin_in.is_system_account
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin


def update_admin(db: Session, admin_id: uuid.UUID, admin_in: AdminUpdate) -> Optional[Admin]:
    db_admin = db.query(Admin).filter(Admin.admin_id == admin_id).first()
    if not db_admin:
        return None

    update_data = admin_in.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data["password"])
        del update_data["password"]

    for field, value in update_data.items():
        setattr(db_admin, field, value)

    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin


def delete_admin(db: Session, admin_id: uuid.UUID) -> Optional[Admin]:
    db_admin = db.query(Admin).filter(Admin.admin_id == admin_id).first()
    if not db_admin:
        return None
    db.delete(db_admin)
    db.commit()
    return db_admin
