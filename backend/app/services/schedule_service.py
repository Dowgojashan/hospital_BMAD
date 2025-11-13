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
                schedule.status = 'leave_approved'
                schedule.max_patients = 0
            else:
                schedule = Schedule(
                    doctor_id=doctor_id,
                    date=leave_request_in.date,
                    time_period=leave_request_in.time_period,
                    status='leave_approved',
                    max_patients=0,
                    booked_patients=0,
                )
            db.add(schedule)
            db.commit()
            db.refresh(schedule)
            return SchedulePublic.model_validate(schedule)
        except Exception as e:
            db.rollback()
            raise e

    def request_doctor_leave_range(
        self, db: Session, *, doctor_id: uuid.UUID, leave_request_in: LeaveRequestRangeCreate
    ) -> List[SchedulePublic]:
        updated_schedules = []
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
                        schedule.status = 'leave_approved'
                        schedule.max_patients = 0
                        db.add(schedule)
                        updated_schedules.append(schedule)
                    # else: If no existing schedule, skip this slot as per user's clarification
                    # continue
                current_date += timedelta(days=1)
            
            db.commit()
            for schedule in updated_schedules:
                db.refresh(schedule)

            return [SchedulePublic.model_validate(s) for s in updated_schedules]
        except Exception as e:
            db.rollback()
            raise e

schedule_service = ScheduleService()
