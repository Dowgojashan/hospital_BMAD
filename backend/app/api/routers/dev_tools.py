# backend/app/api/routers/dev_tools.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, datetime, time
from typing import List
import os
import logging

from app.db.session import get_db
from app.api.dependencies import get_current_active_admin # 假設需要管理員權限
from app.models.schedule import Schedule
from app.crud import crud_schedule, crud_room_day
from app.schemas.room_day import RoomDayCreate

router = APIRouter()
logger = logging.getLogger(__name__)

# 定義診間開放報到時間的映射
CLINIC_OPEN_TIMES = {
    "morning": {"start_booking": time(8, 0), "end_booking": time(11, 30)},
    "afternoon": {"start_booking": time(13, 0), "end_booking": time(16, 30)},
    "night": {"start_booking": time(18, 0), "end_booking": time(20, 30)},
}

@router.post("/trigger_auto_clinic_open", status_code=status.HTTP_200_OK)
async def trigger_auto_clinic_open(
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_active_admin) # 確保只有管理員能觸發
):
    """
    [開發工具] 手動觸發自動開診邏輯，為當天符合條件的班表初始化 RoomDay 記錄。
    僅限開發環境使用。
    """
    # 確保只在開發環境中運行
    if os.getenv("ENV") != "development":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="此端點僅限開發環境使用。"
        )

    today = date.today()
    now = datetime.now().time()
    opened_clinics = []
    failed_clinics = []

    logger.info(f"觸發自動開診邏輯，當前日期: {today}, 當前時間: {now}")

    # 獲取今天所有可用的班表
    # 假設 crud_schedule.list_schedules 可以按日期篩選
    schedules_today = crud_schedule.list_schedules(db, date=today.strftime("%Y-%m-%d")) # 將日期轉換為字串

    if not schedules_today:
        logger.info(f"今天 {today} 沒有找到任何班表。")
        return {"message": f"今天 {today} 沒有找到任何班表。", "opened_clinics": [], "failed_clinics": []}

    for schedule in schedules_today:
        time_period_str = schedule.time_period
        doctor_id = schedule.doctor_id
        
        logger.info(f"處理班表: Doctor ID={doctor_id}, Time Period={time_period_str}")

        if time_period_str in CLINIC_OPEN_TIMES:
            booking_window = CLINIC_OPEN_TIMES[time_period_str]
            
            # 判斷當前時間是否在該時段的開放報到時間內
            if booking_window["start_booking"] <= now <= booking_window["end_booking"]:
                try:
                    # 檢查 RoomDay 是否已存在
                    room_day = crud_room_day.room_day.get_by_room_id_and_date(db, room_id=doctor_id, date=today)
                    
                    if not room_day:
                        # 如果不存在，則創建新的 RoomDay 記錄
                        room_day_create = RoomDayCreate(
                            room_id=doctor_id,
                            date=today,
                            next_sequence=1,
                            current_called_sequence=0 # 初始化為0
                        )
                        crud_room_day.room_day.create(db, obj_in=room_day_create)
                        opened_clinics.append(f"Dr. {doctor_id} - {time_period_str} (新開)")
                        logger.info(f"成功為 Dr. {doctor_id} - {time_period_str} 創建 RoomDay 記錄。")
                    else:
                        # 如果已存在，確保其狀態是「開診中」或更新其狀態
                        # 這裡可以根據實際需求決定是否更新現有 RoomDay 記錄
                        opened_clinics.append(f"Dr. {doctor_id} - {time_period_str} (已存在)")
                        logger.info(f"Dr. {doctor_id} - {time_period_str} 的 RoomDay 記錄已存在。")
                except Exception as e:
                    failed_clinics.append(f"Dr. {doctor_id} - {time_period_str} (錯誤: {e})")
                    logger.error(f"處理 Dr. {doctor_id} - {time_period_str} 的 RoomDay 記錄時發生錯誤: {e}", exc_info=True)
            else:
                logger.info(f"班表 {doctor_id} - {time_period_str} 不在開放報到時間內 (當前時間: {now})。")
        else:
            logger.warning(f"未知的時段類型: {time_period_str}。")

    db.commit() # 提交所有 RoomDay 的變更
    logger.info(f"自動開診邏輯執行完畢。成功開診: {len(opened_clinics)} 個，失敗: {len(failed_clinics)} 個。")
    return {
        "message": "自動開診邏輯已觸發。",
        "opened_clinics": opened_clinics,
        "failed_clinics": failed_clinics
    }
