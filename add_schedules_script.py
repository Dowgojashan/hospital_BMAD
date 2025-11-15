import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date
import uuid

# Add the backend app directory to the Python path
# This ensures that imports like 'from models.doctor import Doctor' work correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend', 'app')))

# Corrected imports to be absolute from the 'app' package
from models.doctor import Doctor
from schemas.schedule import ScheduleCreate, TIME_PERIOD_ENUM
from crud import crud_schedule

# Get database URL from environment, similar to app/db/session.py
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://appuser:password@db:5432/hospital")
if not DATABASE_URL:
    print("DATABASE_URL not found in environment. Please ensure it's set.")
    sys.exit(1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_doctors_and_add_schedules():
    db = SessionLocal()
    try:
        doctors = db.query(Doctor).all()
        if not doctors:
            print("No doctors found in the database.")
            return

        print("Found doctors:")
        for doctor in doctors:
            print(f"  ID: {doctor.doctor_id}, Name: {doctor.name}, Specialty: {doctor.specialty}")

        target_date = date(2025, 11, 15) # November 15th, 2025
        time_periods = ["morning", "afternoon", "night"]

        print(f"\nAttempting to add schedules for {target_date}...")
        for doctor in doctors:
            for time_period_str in time_periods:
                try:
                    # Ensure time_period_str is a valid TIME_PERIOD_ENUM
                    time_period = TIME_PERIOD_ENUM(time_period_str)
                    
                    schedule_in = ScheduleCreate(
                        doctor_id=doctor.doctor_id,
                        date=target_date,
                        time_period=time_period,
                        max_patients=10 # Default max patients
                    )
                    crud_schedule.create_schedule(db, schedule_in=schedule_in)
                    print(f"  Successfully added schedule for Dr. {doctor.name}, {target_date}, {time_period_str}")
                except Exception as e:
                    print(f"  Failed to add schedule for Dr. {doctor.name}, {target_date}, {time_period_str}: {e}")
        
        db.commit()
        print("\nAll schedule creation attempts completed.")

    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Temporarily set the environment variable to allow same-day operations for this script
    os.environ["ALLOW_SAME_DAY_OPERATIONS_FOR_TESTING"] = "true"
    get_doctors_and_add_schedules()
    # Unset the environment variable after execution
    del os.environ["ALLOW_SAME_DAY_OPERATIONS_FOR_TESTING"]
