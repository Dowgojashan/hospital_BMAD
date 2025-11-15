from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List
import uuid

from app.models.schedule import Schedule
from app.models.doctor import Doctor
from app.models.leave_request import LeaveRequest
from app.schemas.leave_request import LeaveRequestCreate, LeaveRequestRangeCreate
from fastapi import HTTPException, status

def request_leave(db: Session, doctor_id: uuid.UUID, date: date, time_period: str, reason: str):
    """
    處理醫生單日單時段的停診申請。
    """
    # 檢查該時段的班表是否存在且屬於該醫生
    schedule = db.query(Schedule).filter(
        Schedule.doctor_id == doctor_id,
        Schedule.date == date,
        Schedule.time_period == time_period
    ).first()

    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到對應的班表。")
    
    # 檢查是否已存在該班表的請假申請
    existing_leave_request = db.query(LeaveRequest).filter(LeaveRequest.schedule_id == schedule.schedule_id).first()

    if existing_leave_request:
        # 如果已存在，則更新其原因
        existing_leave_request.reason = reason
        db.add(existing_leave_request)
        db_leave_request = existing_leave_request
    else:
        # 否則，創建新的請假申請記錄
        db_leave_request = LeaveRequest(
            schedule_id=schedule.schedule_id,
            doctor_id=doctor_id,
            reason=reason
        )
        db.add(db_leave_request)

    # 更新班表狀態為 'leave_pending'
    schedule.status = "leave_pending"
    db.add(schedule)
    db.commit()
    db.refresh(db_leave_request)
    db.refresh(schedule)

    return db_leave_request

def request_range_leave(db: Session, doctor_id: uuid.UUID, start_date: date, end_date: date, time_periods: List[str], reason: str):
    """
    處理醫生連續多日的停診申請。
    """
    if start_date > end_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="開始日期不能晚於結束日期。")

    current_date = start_date
    while current_date <= end_date:
        for time_period in time_periods:
            # 檢查該時段的班表是否存在且屬於該醫生
            schedule = db.query(Schedule).filter(
                Schedule.doctor_id == doctor_id,
                Schedule.date == current_date,
                Schedule.time_period == time_period
            ).first()

            if schedule:
                # 檢查是否已存在該班表的請假申請
                existing_leave_request = db.query(LeaveRequest).filter(LeaveRequest.schedule_id == schedule.schedule_id).first()

                if existing_leave_request:
                    # 如果已存在，則更新其原因
                    existing_leave_request.reason = reason
                    db.add(existing_leave_request)
                else:
                    # 否則，創建新的請假申請記錄
                    db_leave_request = LeaveRequest(
                        schedule_id=schedule.schedule_id,
                        doctor_id=doctor_id,
                        reason=reason
                    )
                    db.add(db_leave_request)

                # 更新班表狀態為 'leave_pending'
                schedule.status = "leave_pending"
                db.add(schedule)
        
        current_date += timedelta(days=1)
    
    db.commit()
    return {"message": "連續停診申請已送出，等待管理員審核。"}

def approve_leave_request(db: Session, schedule_id: uuid.UUID):
    """
    管理員核准停診申請。
    """
    leave_request = db.query(LeaveRequest).filter(LeaveRequest.schedule_id == schedule_id).first()
    if not leave_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到對應的停診申請。")
    
    schedule = db.query(Schedule).filter(Schedule.schedule_id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到對應的班表。")

    # 更新請假申請狀態
    leave_request.status = "approved"
    db.add(leave_request)

    # 更新班表狀態為 'leave_approved' 並將 max_patients 設為 0
    schedule.status = "leave_approved"
    schedule.max_patients = 0
    db.add(schedule)

    db.commit()
    db.refresh(leave_request)
    db.refresh(schedule)
    return {"message": "停診申請已核准。"}

def reject_leave_request(db: Session, schedule_id: uuid.UUID):
    """
    管理員拒絕停診申請。
    """
    leave_request = db.query(LeaveRequest).filter(LeaveRequest.schedule_id == schedule_id).first()
    if not leave_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到對應的停診申請。")
    
    schedule = db.query(Schedule).filter(Schedule.schedule_id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到對應的班表。")

    # 更新請假申請狀態
    leave_request.status = "rejected"
    db.add(leave_request)

    # 更新班表狀態為 'available' 並將 max_patients 設為預設值 (例如 10)
    schedule.status = "available"
    schedule.max_patients = 10 # Revert to default max patients
    db.add(schedule)

    db.commit()
    db.refresh(leave_request)
    db.refresh(schedule)
    return {"message": "停診申請已拒絕。"}