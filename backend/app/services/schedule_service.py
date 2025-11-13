from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import uuid
from datetime import date, timedelta
from typing import List, Optional, Literal # Import List, Optional, Literal

from app.models.schedule import Schedule
from app.schemas.schedule import LeaveRequestCreate, SchedulePublic, LeaveRequestRangeCreate

class ScheduleService:
    def request_doctor_leave(
        self, db: Session, *, doctor_id: uuid.UUID, leave_request_in: LeaveRequestCreate
    ) -> SchedulePublic:
        with db.begin():
            # Try to find an existing schedule for the given date and time period
            schedule = db.query(Schedule).filter(
                Schedule.doctor_id == doctor_id,
                Schedule.date == leave_request_in.date,
                Schedule.time_period == leave_request_in.time_period,
            ).with_for_update().first()

            if schedule:
                if schedule.booked_patients > 0:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="該時段已有病患預約，無法停診。"
                    )
                # Update existing schedule to mark as unavailable
                schedule.max_patients = 0
                # Optionally, store the reason somewhere if a field is added to Schedule or a new table
                db.add(schedule)
            else:
                # Create a new schedule entry marked as unavailable
                schedule = Schedule(
                    doctor_id=doctor_id,
                    date=leave_request_in.date,
                    time_period=leave_request_in.time_period,
                    max_patients=0,
                    booked_patients=0, # No patients booked for a new unavailable slot
                )
                db.add(schedule)
            
            db.flush()
            db.commit()
            db.refresh(schedule) # Refresh to get the latest state after commit
            return SchedulePublic.model_validate(schedule)

    def request_doctor_leave_range(
        self, db: Session, *, doctor_id: uuid.UUID, leave_request_in: LeaveRequestRangeCreate
    ) -> List[SchedulePublic]:
        updated_schedules = []
        
        with db.begin():
            # First, check for any conflicts in the entire range
            current_date = leave_request_in.start_date
            while current_date <= leave_request_in.end_date:
                for time_period in leave_request_in.time_periods:
                    existing_schedule = db.query(Schedule).filter(
                        Schedule.doctor_id == doctor_id,
                        Schedule.date == current_date,
                        Schedule.time_period == time_period,
                        Schedule.booked_patients > 0
                    ).first()
                    if existing_schedule:
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail=f"日期 {current_date} 的 {time_period} 時段已有病患預約，無法申請連續停診。"
                        )
                current_date += timedelta(days=1)

            # If no conflicts, proceed with creating/updating schedules
            current_date = leave_request_in.start_date
            while current_date <= leave_request_in.end_date:
                for time_period in leave_request_in.time_periods:
                    schedule = db.query(Schedule).filter(
                        Schedule.doctor_id == doctor_id,
                        Schedule.date == current_date,
                        Schedule.time_period == time_period,
                    ).with_for_update().first()

                    if schedule:
                        schedule.max_patients = 0
                    else:
                        schedule = Schedule(
                            doctor_id=doctor_id,
                            date=current_date,
                            time_period=time_period,
                            max_patients=0,
                            booked_patients=0,
                        )
                    db.add(schedule)
                    updated_schedules.append(schedule)
                current_date += timedelta(days=1)
            
            db.flush()
            db.commit()

            # Refresh each object to get its state after commit
            for schedule in updated_schedules:
                db.refresh(schedule)

            return [SchedulePublic.model_validate(s) for s in updated_schedules]

schedule_service = ScheduleService()
