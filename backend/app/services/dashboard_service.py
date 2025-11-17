from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date, datetime, timedelta

from app.models.appointment import Appointment
from app.models.checkin import Checkin
from app.models.schedule import Schedule
from app.models.doctor import Doctor
from app.schemas.dashboard import DashboardStats, ClinicLoad

def get_admin_dashboard_stats(db: Session) -> DashboardStats:
    today = date.today()

    # Total appointments for today
    total_appointments_today = db.query(Appointment).filter(
        Appointment.date == today
    ).count()

    # Checked-in count
    checked_in_count = db.query(Checkin).filter(
        func.date(Checkin.checkin_time) == today,
        Checkin.status == "checked_in"
    ).count()

    # Waiting count (patients with appointments today who are not yet completed or no-show)
    # This is a simplified logic. A more robust solution would involve checking current queue status.
    waiting_count = db.query(Appointment).filter(
        Appointment.date == today,
        Appointment.status.in_(["scheduled", "checked_in"]) # Assuming these statuses mean waiting or not yet completed
    ).count()

    # Completed count (based on checkin status 'seen')
    completed_count = db.query(Checkin).filter(
        func.date(Checkin.checkin_time) == today,
        Checkin.status == "seen"
    ).count()

    # Clinic Load
    clinic_load_data = []
    doctors = db.query(Doctor).all()
    for doctor in doctors:
        # Get schedules for this doctor today
        schedules_today = db.query(Schedule).filter(
            Schedule.doctor_id == doctor.doctor_id,
            Schedule.date == today
        ).all()

        for schedule in schedules_today:
            # Count current patients for this schedule (e.g., checked_in and not yet seen/completed)
            current_patients = db.query(Checkin).filter(
                Checkin.appointment_id.in_([app.appointment_id for app in schedule.appointments]),
                Checkin.status == "checked_in"
            ).count()

            # Count waiting patients for this schedule (e.g., scheduled but not yet checked_in)
            waiting_patients = db.query(Appointment).filter(
                Appointment.schedule_id == schedule.schedule_id,
                Appointment.status == "scheduled"
            ).count()

            clinic_load_data.append(
                ClinicLoad(
                    clinic_id=str(doctor.doctor_id), # Using doctor_id as clinic_id for simplicity
                    clinic_name=f"{doctor.name} 診間", # Using doctor's name as clinic name
                    specialty=doctor.specialty, # Added specialty
                    time_period=schedule.time_period, # Added time_period
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
