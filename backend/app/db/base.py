from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import all models here to ensure they are registered with SQLAlchemy MetaData
# This is crucial for Alembic autogenerate to detect them.
from app.models.admin import Admin
from app.models.appointment import Appointment
from app.models.audit_log import AuditLog
from app.models.checkin import Checkin
from app.models.doctor import Doctor
from app.models.infraction import Infraction
from app.models.leave_request import LeaveRequest
from app.models.medical_record import MedicalRecord
from app.models.patient import Patient
from app.models.room_day import RoomDay
from app.models.schedule import Schedule
from app.models.visit_call import VisitCall

__all__ = ["Base"]

