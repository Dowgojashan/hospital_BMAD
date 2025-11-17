from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date, datetime, timedelta
from typing import Optional

from app.models.appointment import Appointment
from app.models.checkin import Checkin
from app.models.schedule import Schedule
from app.models.doctor import Doctor
from app.schemas.dashboard import DashboardStats, ClinicLoad

def get_admin_dashboard_stats(db: Session, department: Optional[str] = None) -> DashboardStats:
    today = date.today()

    # Base query for appointments joined with doctors
    appointment_query = db.query(Appointment).join(Doctor, Appointment.doctor_id == Doctor.doctor_id)
    if department:
        appointment_query = appointment_query.filter(Doctor.specialty == department)

    # Total appointments for today
    total_appointments_today = appointment_query.filter(Appointment.date == today).count()

    # Base query for check-ins joined with appointments and doctors
    checkin_query = db.query(Checkin).join(Appointment, Checkin.appointment_id == Appointment.appointment_id).join(Doctor, Appointment.doctor_id == Doctor.doctor_id)
    if department:
        checkin_query = checkin_query.filter(Doctor.specialty == department)

    # Checked-in count
    checked_in_count = checkin_query.filter(
        func.date(Checkin.checkin_time) == today,
        Checkin.status == "checked_in"
    ).count()

    # Waiting count
    waiting_count = appointment_query.filter(
        Appointment.date == today,
        Appointment.status.in_(["scheduled", "checked_in"])
    ).count()

    # Completed count
    completed_count = checkin_query.filter(
        func.date(Checkin.checkin_time) == today,
        Checkin.status == "seen"
    ).count()

    # Clinic Load
    clinic_load_data = []
    doctor_query = db.query(Doctor)
    if department:
        doctor_query = doctor_query.filter(Doctor.specialty == department)
    
    doctors = doctor_query.all()

    for doctor in doctors:
        schedules_today = db.query(Schedule).filter(
            Schedule.doctor_id == doctor.doctor_id,
            Schedule.date == today
        ).all()

        for schedule in schedules_today:
            current_patients = db.query(Checkin).filter(
                Checkin.appointment_id.in_([app.appointment_id for app in schedule.appointments]),
                Checkin.status == "checked_in"
            ).count()

            waiting_patients = db.query(Appointment).filter(
                Appointment.schedule_id == schedule.schedule_id,
                Appointment.status == "scheduled"
            ).count()

            clinic_load_data.append(
                ClinicLoad(
                    clinic_id=str(doctor.doctor_id),
                    clinic_name=f"{doctor.name} 診間",
                    specialty=doctor.specialty,
                    time_period=schedule.time_period,
                    current_patients=current_patients,
                    waiting_count=waiting_patients
                )
            )

    return DashboardStats(
        total_appointments_today=total_appointments_today,
        checked_in_count=checked_in_count,
        waiting_count=waiting_count,
        completed_count=completed_count,
        clinic_load=clinic_load_data
    )
