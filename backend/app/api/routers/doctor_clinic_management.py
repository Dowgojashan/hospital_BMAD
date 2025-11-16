from typing import List, Optional
import uuid
from datetime import date, datetime
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status, Query
import pytz # Import pytz

from app.db.session import get_db
from app.api.dependencies import get_current_active_doctor # 導入正確的 get_current_active_doctor
from app.models.doctor import Doctor
from app.models.schedule import Schedule
from app.models.checkin import Checkin
from app.models.patient import Patient
from app.crud import crud_schedule, crud_checkin, crud_user, crud_leave_request, crud_room_day # Import room_day instance
from app.schemas.room_day import RoomDayCreate
from app.schemas.schedule import SchedulePublic # 假設 SchedulePublic 存在
from app.schemas.leave_request import LeaveRequestCreate, LeaveRequestRangeCreate # 導入請假申請 schema
from app.services.queue_service import QueueService # Import QueueService

router = APIRouter()

def _get_taiwan_current_date():
    """Helper to get the current date in Taiwan time zone."""
    taiwan_tz = pytz.timezone('Asia/Taipei')
    return datetime.now(taiwan_tz).date()

@router.get("/doctor/schedules", response_model=List[SchedulePublic])
async def get_doctor_today_schedules(
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor),
    date_str: Optional[str] = Query(None), # Add date_str parameter
    month: Optional[int] = None, # 允許篩選月份
    year: Optional[int] = None # 允許篩選年份
):
    print(f"DEBUG: get_doctor_today_schedules endpoint hit. doctor_id={current_doctor.doctor_id}, date_str={date_str}")
    """
    獲取醫生指定月份和年份的班表。
    """
    schedules = crud_schedule.get_doctor_schedules(db, doctor_id=current_doctor.doctor_id, date_str=date_str, month=month, year=year)
    
    # 將 Schedule 轉換為 SchedulePublic 格式
    result = []
    for s in schedules:
        # crud_schedule.get_doctor_schedules 返回的是包含 doctor_name 和 specialty 的字典
        # SchedulePublic 需要這些額外字段
        result.append(SchedulePublic(
            schedule_id=s["schedule_id"],
            doctor_id=s["doctor_id"],
            date=s["date"],
            time_period=s["time_period"],
            status=s["status"],
            max_patients=s["max_patients"],
            booked_patients=s["booked_patients"],
            recurring_group_id=s["recurring_group_id"],
            created_at=s["created_at"],
            doctor_name=s["doctor_name"],
            specialty=s["specialty"]
        ))
    return result


@router.post("/doctor/me/leave-requests", status_code=status.HTTP_201_CREATED)
async def request_single_day_leave(
    leave_request_in: LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """
    醫生申請單日停診。
    """
    try:
        crud_leave_request.request_leave(
            db,
            doctor_id=current_doctor.doctor_id,
            date=leave_request_in.date,
            time_period=leave_request_in.time_period,
            reason=leave_request_in.reason
        )
        return {"message": "單日停診申請已送出，等待管理員審核。"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"單日停診申請失敗: {e}")


@router.post("/doctor/me/leave-requests/range", status_code=status.HTTP_201_CREATED)
async def request_range_leave(
    leave_request_in: LeaveRequestRangeCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """
    醫生申請連續多日停診。
    """
    try:
        crud_leave_request.request_range_leave(
            db,
            doctor_id=current_doctor.doctor_id,
            start_date=leave_request_in.start_date,
            end_date=leave_request_in.end_date,
            time_periods=leave_request_in.time_periods,
            reason=leave_request_in.reason
        )
        return {"message": "連續停診申請已送出，等待管理員審核。"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"連續停診申請失敗: {e}")


@router.post("/doctor/schedules/{schedule_id}/open-clinic", status_code=status.HTTP_200_OK)
async def open_clinic(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """
    醫生手動開診，初始化或更新 RoomDay 記錄。
    """
    print(f"DEBUG: open_clinic endpoint hit for schedule_id={schedule_id}, doctor_id={current_doctor.doctor_id}")
    schedule = crud_schedule.get_schedule(db, schedule_id=schedule_id)
    if not schedule or schedule.doctor_id != current_doctor.doctor_id:
        print(f"DEBUG: Schedule not found or does not belong to doctor. schedule={schedule}, current_doctor.doctor_id={current_doctor.doctor_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found or does not belong to this doctor.")
    
    if schedule.date != _get_taiwan_current_date():
        print(f"DEBUG: Schedule date is not today. schedule.date={schedule.date}, today={_get_taiwan_current_date()}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="只能開診今日的班表。")

    try:
        print(f"DEBUG: Checking RoomDay for schedule_id={schedule_id}")
        room_day = crud_room_day.room_day.get_by_schedule_id(db, schedule_id=schedule_id)
        
        if not room_day:
            print(f"DEBUG: RoomDay not found. Creating new RoomDay.")
            room_day_create = RoomDayCreate(
                schedule_id=schedule_id,
                next_sequence=1,
                current_called_sequence=0
            )
            crud_room_day.room_day.create(db, obj_in=room_day_create)
            print(f"DEBUG: New RoomDay created.")
        else:
            print(f"DEBUG: RoomDay found. Updating existing RoomDay.")
            room_day.current_called_sequence = 0 # 重新開診時重置叫號
            room_day.next_sequence = max(room_day.next_sequence, 1) # 確保至少從1開始
            db.add(room_day)
            db.commit()
            db.refresh(room_day)
            print(f"DEBUG: Existing RoomDay updated.")

        # 更新 Schedule 狀態為 'in_progress' 或 'open'
        crud_schedule.update_schedule_status(db, schedule_id=schedule_id, new_status="open")
        
        return {"message": f"診間 {schedule_id} 已成功開診。"}
    except Exception as e:
        print(f"ERROR: Exception in open_clinic: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"開診失敗: {e}")


@router.post("/doctor/schedules/{schedule_id}/close-clinic", status_code=status.HTTP_200_OK)
async def close_clinic(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """
    醫生手動關診，將 RoomDay 記錄標記為非活躍或刪除。
    """
    schedule = crud_schedule.get_schedule(db, schedule_id=schedule_id)
    if not schedule or schedule.doctor_id != current_doctor.doctor_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found or does not belong to this doctor.")
    
    if schedule.date != _get_taiwan_current_date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="只能關診今日的班表。")

    try:
        room_day = crud_room_day.room_day.get_by_schedule_id(db, schedule_id=schedule_id)
        
        if room_day:
            db.delete(room_day)
            db.commit()
        
        crud_schedule.update_schedule_status(db, schedule_id=schedule_id, new_status="closed")

        return {"message": f"診間 {schedule_id} 已成功關診。"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"關診失敗: {e}")


@router.get("/doctor/schedules/{schedule_id}/queue-status", response_model=dict)
async def get_doctor_schedule_queue_status(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """
    獲取醫生特定班表的候診資訊。
    """
    schedule = crud_schedule.get_schedule(db, schedule_id=schedule_id)
    if not schedule or schedule.doctor_id != current_doctor.doctor_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found or does not belong to this doctor.")
    
    if schedule.date != _get_taiwan_current_date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="只能查詢今日班表的候診資訊。")

    room_day = crud_room_day.room_day.get_by_schedule_id(db, schedule_id=schedule_id)

    if not room_day:
        # 如果 RoomDay 不存在，表示診間未開診
        return {
            "current_number": "N/A",
            "waiting_count": 0,
            "estimated_wait_time": 0,
            "clinic_status": "未開診",
            "message": "診間尚未開診。"
        }
    
    # 獲取該班表時段所有已報到但未看診的病患
    checked_in_patients = crud_checkin.checkin.get_checked_in_patients_for_schedule(db, schedule_id=schedule_id)
    
    # 計算前方等待人數
    waiting_count = 0
    for checkin in checked_in_patients:
        if checkin.ticket_sequence > room_day.current_called_sequence:
            waiting_count += 1
    
    estimated_wait_time = waiting_count * 10 # 假設每位病患看診10分鐘

    return {
        "current_number": f"A{room_day.current_called_sequence:03d}",
        "waiting_count": waiting_count,
        "estimated_wait_time": estimated_wait_time,
        "clinic_status": "開診中",
        "message": "候診資訊已更新。"
    }


@router.post("/doctor/schedules/{schedule_id}/call-next-patient", status_code=status.HTTP_200_OK)
async def call_next_patient(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """
    醫生叫號下一位病患。
    """
    schedule = crud_schedule.get_schedule(db, schedule_id=schedule_id)
    if not schedule or schedule.doctor_id != current_doctor.doctor_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found or does not belong to this doctor.")
    
    if schedule.date != _get_taiwan_current_date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="只能叫號今日班表的病患。")

    room_day = crud_room_day.room_day.get_by_schedule_id(db, schedule_id=schedule_id)

    if not room_day:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="診間尚未開診，無法叫號。")
    
    # 增加叫號
    room_day.current_called_sequence += 1
    db.add(room_day)
    db.commit()
    db.refresh(room_day)

    # 找到被叫號的病患並更新其狀態為 'seen'
    called_patient_checkin = crud_checkin.checkin.get_checkin_by_schedule_id_and_sequence(
        db,
        schedule_id=schedule_id,
        ticket_sequence=room_day.current_called_sequence
    )
    if called_patient_checkin:
        called_patient_checkin.status = "seen"
        db.add(called_patient_checkin)
        db.commit()
        db.refresh(called_patient_checkin)

    # TODO: 發送通知給被叫號的病患

    return {"message": f"已叫號至 A{room_day.current_called_sequence:03d}。"}


@router.get("/doctor/schedules/{schedule_id}/waiting-patients", response_model=List[dict])
async def get_waiting_patients(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """
    獲取醫生特定班表時段的候診病患列表。
    """
    schedule = crud_schedule.get_schedule(db, schedule_id=schedule_id)
    if not schedule or schedule.doctor_id != current_doctor.doctor_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found or does not belong to this doctor.")
    
    if schedule.date != _get_taiwan_current_date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="只能查詢今日班表的候診病患。")

    room_day = crud_room_day.room_day.get_by_schedule_id(db, schedule_id=schedule_id)

    if not room_day:
        return [] # 如果診間未開診，則沒有候診病患

    checked_in_patients = crud_checkin.checkin.get_checked_in_patients_for_schedule(db, schedule_id=schedule_id)
    
    # 篩選出所有已報到或已看診的病患，並按號碼排序
    waiting_list = []
    for checkin in checked_in_patients:
        # 包含所有 'checked_in' 和 'seen' 狀態的病患
        if checkin.status in ["checked_in", "seen"]:
            patient = crud_user.get_patient(db, patient_id=checkin.patient_id) # 假設 crud_user.get_patient 存在
            if patient:
                waiting_list.append({
                    "patient_id": patient.patient_id,
                    "patient_name": patient.name,
                    "ticket_number": checkin.ticket_number,
                    "ticket_sequence": checkin.ticket_sequence,
                    "checkin_time": checkin.checkin_time,
                    "appointment_id": checkin.appointment_id,
                    "checkin_id": checkin.checkin_id,
                    "status": checkin.status # Add status here
                })
    
    waiting_list.sort(key=lambda x: x["ticket_sequence"])
    return waiting_list

@router.post("/doctor/schedules/{schedule_id}/checkins/{checkin_id}/mark-no-show", status_code=status.HTTP_200_OK)
async def mark_patient_no_show(
    schedule_id: uuid.UUID,
    checkin_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """
    醫生將特定班表中的病患標記為未到。
    """
    schedule = crud_schedule.get_schedule(db, schedule_id=schedule_id)
    if not schedule or schedule.doctor_id != current_doctor.doctor_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found or does not belong to this doctor.")
    
    if schedule.date != _get_taiwan_current_date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="只能操作今日班表的報到記錄。")

    try:
        queue_service = QueueService(db)
        result = await queue_service.mark_no_show(checkin_id=checkin_id)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"標記未到失敗: {e}")

@router.post("/doctor/schedules/{schedule_id}/checkins/{checkin_id}/re-check-in", status_code=status.HTTP_200_OK)
async def re_check_in_patient(
    schedule_id: uuid.UUID,
    checkin_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor)
):
    """
    醫生為未到的病患進行補報到。
    """
    schedule = crud_schedule.get_schedule(db, schedule_id=schedule_id)
    if not schedule or schedule.doctor_id != current_doctor.doctor_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found or does not belong to this doctor.")
    
    if schedule.date != _get_taiwan_current_date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="只能操作今日班表的報到記錄。")

    try:
        queue_service = QueueService(db)
        result = await queue_service.re_check_in(checkin_id=checkin_id)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc() # Print the full traceback to the console
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"補報到失敗: {e}")