import random
import string
from sqlalchemy.orm import Session

from app.models.doctor import Doctor
from app.models.admin import Admin
from app.schemas.doctor import DoctorCreate
from app.schemas.admin import AdminCreate
from app.crud import crud_doctor, crud_admin

def random_lower_string() -> str:
    return "".join(random.choices(string.ascii_lowercase, k=32))

def random_email() -> str:
    return f"{random_lower_string()}@{random_lower_string()}.com"

def create_random_doctor(db: Session) -> Doctor:
    doctor_in = DoctorCreate(
        doctor_login_id=random_lower_string(),
        password=random_lower_string(),
        name=random_lower_string(),
        specialty="Cardiology",
        email=random_email() # Add email field
    )
    return crud_doctor.create_doctor(db=db, doctor_in=doctor_in)

def create_random_admin(db: Session) -> Admin:
    admin_in = AdminCreate(
        account_username=random_lower_string(),
        password=random_lower_string(),
        name=random_lower_string(),
        email=random_email()
    )
    return crud_admin.create_admin(db=db, admin_in=admin_in)
