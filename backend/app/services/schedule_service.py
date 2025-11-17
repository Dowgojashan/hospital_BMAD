from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import uuid
from datetime import date, timedelta
from typing import List, Optional, Literal # Import List, Optional, Literal

from app.models.schedule import Schedule
from app.models.leave_request import LeaveRequest # Import LeaveRequest model
from app.schemas.schedule import SchedulePublic, LeaveRequestRangeCreate, DoctorLeaveRequestInput
from app.schemas.leave_request import LeaveRequestCreate as DBLRCreate # Alias to avoid conflict
from app.crud import crud_leave_request

class ScheduleService:
    def request_doctor_leave(
        self, db: Session, *, doctor_id: uuid.UUID, leave_request_in: DoctorLeaveRequestInput
    ) -> SchedulePublic:
        try:
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
                schedule.status = 'leave_pending'
                schedule.max_patients = 0
            else:
                schedule = Schedule(
                    doctor_id=doctor_id,
                    date=leave_request_in.date,
                    time_period=leave_request_in.time_period,
                    status='leave_pending',
                    max_patients=0,
                    booked_patients=0,
                )
            db.add(schedule)
            db.flush() # Flush to get schedule.schedule_id if it's new

            # Create a LeaveRequest entry and assign it to the schedule relationship
            new_leave_request = LeaveRequest(
                schedule_id=schedule.schedule_id,
                doctor_id=doctor_id,
                reason=leave_request_in.reason
            )
            schedule.leave_request = new_leave_request # Assign to relationship

            db.commit() # Commit both schedule and leave request
            db.refresh(schedule) # Refresh after commit

            return SchedulePublic.model_validate(schedule)
        except Exception as e:
            db.rollback()
            raise e

    def request_doctor_leave_range(
        self, db: Session, *, doctor_id: uuid.UUID, leave_request_in: LeaveRequestRangeCreate
    ) -> List[SchedulePublic]:
        updated_schedules = []
        leave_requests_to_add = [] # Collect LeaveRequest objects directly
        try:
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
                        schedule.status = 'leave_pending'
                        schedule.max_patients = 0
                        db.add(schedule) # Add to session
                        updated_schedules.append(schedule)
                        
                        # Prepare LeaveRequest entry and assign to relationship
                        new_leave_request = LeaveRequest(
                            schedule_id=schedule.schedule_id,
                            doctor_id=doctor_id,
                            reason=leave_request_in.reason
                        )
                        schedule.leave_request = new_leave_request # Assign to relationship
                        leave_requests_to_add.append(new_leave_request) # Keep track if needed, but relationship handles add
                    # else: If no existing schedule, skip this slot as per user's clarification
                    # continue
                current_date += timedelta(days=1)
            
            db.flush() # Flush schedules to get IDs if new, before creating leave requests

            # The leave requests are added via the relationship, so no need for separate crud_leave_request.create_leave_request calls here
            # db.add_all(leave_requests_to_add) # Not needed if assigned via relationship with cascade

            db.commit() # Commit once after all schedules and leave requests are processed
            for schedule in updated_schedules:
                db.refresh(schedule) # Refresh after commit

            return [SchedulePublic.model_validate(s) for s in updated_schedules]
        except Exception as e:
            db.rollback()
            raise e
