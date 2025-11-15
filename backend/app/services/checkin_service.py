from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import uuid
from datetime import date, datetime, timedelta
import logging # Import logging
import pytz # Import pytz

from app.crud.crud_appointment import appointment_crud
from app.crud.crud_room_day import room_day as crud_room_day
from app.crud.crud_checkin import checkin as crud_checkin
from app.crud.crud_user import get_patient
from app.schemas.checkin import CheckinCreate
from app.schemas.room_day import RoomDayCreate
from app.models.appointment import Appointment
from app.models.patient import Patient

logger = logging.getLogger(__name__) # Initialize logger

class CheckinService:
    def __init__(self, db: Session):
        self.db = db
        self.appointment_crud = appointment_crud
        self.crud_room_day = crud_room_day
        self.crud_checkin = crud_checkin

    def _get_taiwan_current_date(self):
        """Helper to get the current date in Taiwan time zone."""
        taiwan_tz = pytz.timezone('Asia/Taipei')
        return datetime.now(taiwan_tz).date()

    def create_checkin(
        self,
        db: Session,
        *,
        patient_id: uuid.UUID,
        appointment_id: uuid.UUID,
        checkin_method: str
    ):
        logger.info(f"嘗試為 patient_id={patient_id}, appointment_id={appointment_id} 創建報到記錄。")

        # 1. Fetch Patient and Appointment records
        patient = get_patient(db, patient_id=patient_id)
        appointment = appointment_crud.get(db, appointment_id=appointment_id)

        if not patient:
            logger.warning(f"報到失敗: 未找到 patient_id={patient_id}。")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")
        if not appointment:
            logger.warning(f"報到失敗: 未找到 appointment_id={appointment_id}。")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
        
        # Prevent online check-in if appointment status is 'no_show'
        if appointment.status == "no_show":
            logger.warning(f"報到失敗: 預約 {appointment.appointment_id} 狀態為 'no_show'，無法報到。")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="您已被標記為未到診，請聯繫診所進行補報到。"
            )

        if appointment.patient_id != uuid.UUID(str(patient_id)):
            logger.warning(f"報到失敗: 預約 {appointment_id} 不屬於 patient_id={patient_id}。")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Appointment does not belong to patient.")
        
        logger.info(f"成功獲取 patient (ID: {patient.patient_id}) 和 appointment (ID: {appointment.appointment_id}, Doctor: {appointment.doctor_id}, Date: {appointment.date}, Status: {appointment.status})。")

        # 2. Validate patient's suspension status (AC-3)
        if checkin_method == "online" and patient.suspended_until and patient.suspended_until >= date.today():
            logger.warning(f"報到失敗: patient_id={patient.patient_id} 被限制線上報到，直到 {patient.suspended_until}。")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"您已被限制線上報到，請至現場機台報到。限制解除日期: {patient.suspended_until}"
            )
        logger.info(f"病患停權狀態驗證通過。")

        # 3. Validate appointment status (AC-4)
        if appointment.status not in ["scheduled", "confirmed"]:
            logger.warning(f"報到失敗: 預約 {appointment.appointment_id} 狀態為 '{appointment.status}'，無法報到。")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"預約狀態為 '{appointment.status}'，無法報到。"
            )
        logger.info(f"預約狀態驗證通過。")
        
        # 4. Prevent same-day booking check-in (AC-5)
        # This check is already in appointment_service.create_appointment, but for check-in,
        # we need to ensure the appointment date is not in the past or future beyond a reasonable window.
        # For simplicity, let's assume check-in is only allowed on the appointment date.
        if appointment.date != self._get_taiwan_current_date():
            logger.warning(f"報到失敗: 預約 {appointment.appointment_id} 日期 {appointment.date} 不為今天 {self._get_taiwan_current_date()}。")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="只能在預約當天報到。"
            )
        logger.info(f"預約日期驗證通過。")

        # 5. Atomic ticket sequence generation (AC-6)
        # Use schedule_id for RoomDay operations
        schedule_id = appointment.schedule_id
        logger.info(f"嘗試獲取或創建 RoomDay 記錄，schedule_id={schedule_id}。")

        # Get or create RoomDay for today and lock it for update
        db.begin_nested() # Start a nested transaction for RoomDay operations
        try:
            db_room_day = crud_room_day.get_by_schedule_id(db, schedule_id=schedule_id)
            
            if not db_room_day:
                logger.info(f"RoomDay 記錄不存在，為 schedule_id={schedule_id} 創建新的 RoomDay 記錄。")
                db_room_day = crud_room_day.create(db, obj_in=RoomDayCreate(schedule_id=schedule_id, next_sequence=1))
            
            # Atomically increment next_sequence
            # We need to re-fetch with FOR UPDATE to ensure we have the latest locked version
            db_room_day_locked = crud_room_day.get_room_day_for_update(db, schedule_id=schedule_id)
            if not db_room_day_locked: # Should not happen if created above, but for safety
                logger.error(f"報到失敗: 無法獲取 RoomDay 鎖定，schedule_id={schedule_id}。")
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to acquire room day lock.")

            ticket_sequence = db_room_day_locked.next_sequence
            db_room_day_locked.next_sequence += 1 # Increment the sequence
            db.add(db_room_day_locked) # Persist the increment
            db.flush() # Flush to ensure the update is part of the current transaction
            logger.info(f"RoomDay 記錄更新成功，分配 ticket_sequence={ticket_sequence}。")
            db.commit() # Commit the nested transaction
        except Exception as e:
            db.rollback() # Rollback the nested transaction
            logger.error(f"RoomDay 操作失敗: {e}", exc_info=True)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"RoomDay 操作失敗: {e}")


        ticket_number = f"A{ticket_sequence:03d}" # Format as A001, A002, etc.
        logger.info(f"生成號碼牌: {ticket_number}。")

        # 6. Update APPOINTMENT status (AC-1)
        self.appointment_crud.update_status(db, appointment_id=appointment.appointment_id, new_status="checked_in")
        logger.info(f"預約 {appointment.appointment_id} 狀態更新為 'checked_in'。")

        # 7. Create CHECKIN record (AC-1)
        taiwan_tz = pytz.timezone('Asia/Taipei')
        checkin_obj_in = CheckinCreate(
            appointment_id=appointment.appointment_id,
            patient_id=patient_id,
            checkin_time=datetime.now(taiwan_tz),
            checkin_method=checkin_method,
            ticket_sequence=ticket_sequence,
            ticket_number=ticket_number
        )
        new_checkin = crud_checkin.create(db, obj_in=checkin_obj_in)
        logger.info(f"創建新的 Checkin 記錄 (ID: {new_checkin.checkin_id})。")

        db.commit() # Commit the main transaction
        db.refresh(appointment) # Refresh appointment to reflect new status
        db.refresh(new_checkin) # Refresh new_checkin
        logger.info(f"報到流程成功完成，所有變更已提交。")

        return {
            "appointment_id": appointment.appointment_id,
            "patient_id": patient_id,
            "ticket_number": ticket_number,
            "status": appointment.status
        }
