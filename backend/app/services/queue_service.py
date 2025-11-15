from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from uuid import UUID

from ..crud.queue_crud import QueueCRUD
from ..crud.crud_appointment import appointment_crud # Corrected import
from ..crud.visit_call_crud import VisitCallCRUD # Assuming VisitCallCRUD exists
from ..models.room_day import RoomDay
from ..models.checkin import Checkin
from ..models.appointment import Appointment
from ..services.notification_service import NotificationService
from ..services.infraction_service import InfractionService # Assuming InfractionService exists
from fastapi import HTTPException, status # Import HTTPException and status

class QueueService:
    def __init__(self, db: Session):
        self.db = db
        self.queue_crud = QueueCRUD(db)
        self.appointment_crud = appointment_crud # Corrected initialization
        self.visit_call_crud = VisitCallCRUD(db) # Initialize VisitCallCRUD
        self.notification_service = NotificationService()
        self.infraction_service = InfractionService(db) # Initialize InfractionService

    async def get_patient_queue_status(self, appointment_id: UUID, patient_id: UUID):
        # 1. Get the Appointment record
        appointment_record = self.db.query(Appointment).filter(
            Appointment.appointment_id == appointment_id,
            Appointment.patient_id == patient_id
        ).first()

        if not appointment_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="未找到預約記錄。"
            )

        # 2. Get the RoomDay record using schedule_id
        room_day = self.db.query(RoomDay).filter(
            RoomDay.schedule_id == appointment_record.schedule_id
        ).first()

        if not room_day:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="診間尚未開放或已關閉。" # More descriptive message
            )

        # 3. Attempt to get the Checkin record (optional, as patient might not have checked in yet)
        checkin_record = self.db.query(Checkin).filter(
            Checkin.appointment_id == appointment_id,
            Checkin.patient_id == patient_id
        ).first()

        current_called_sequence = room_day.current_called_sequence if room_day.current_called_sequence is not None else 0
        my_ticket_sequence = checkin_record.ticket_sequence if checkin_record else None

        # Calculate current number, my position, waiting count
        current_number = f"A{current_called_sequence:03d}"

        if my_ticket_sequence is None:
            return {
                "current_number": current_number,
                "my_position": "尚未報到",
                "waiting_count": "N/A",
                "estimated_wait_time": "N/A",
                "status_message": "您尚未報到，請點擊報到按鈕進行報到。"
            }
        
        my_position = f"A{my_ticket_sequence:03d}"

        waiting_count = 0
        estimated_wait_time = 0

        if my_ticket_sequence > current_called_sequence:
            waiting_count = my_ticket_sequence - current_called_sequence - 1
            estimated_wait_time = waiting_count * 10 # 10 minutes per patient

        return {
            "current_number": current_number,
            "my_position": my_position,
            "waiting_count": waiting_count,
            "estimated_wait_time": estimated_wait_time,
            "status_message": "候診資訊已更新。"
        }

    async def call_next(self, schedule_id: UUID, called_ticket_sequence: int):
        # 1. Update current_called_sequence in RoomDay
        room_day = self.queue_crud.update_current_called_sequence(
            schedule_id=schedule_id,
            called_ticket_sequence=called_ticket_sequence
        )

        if not room_day:
            return

        # 2. Calculate target ticket for notification
        target_ticket_sequence = called_ticket_sequence + 2

        # 3. Query CHECKIN to find the patient for the target ticket
        patient_checkin = self.queue_crud.get_checkin_by_ticket_sequence(
            schedule_id=schedule_id,
            ticket_sequence=target_ticket_sequence
        )

        if patient_checkin:
            # 4. Dispatch a notification
            notification_message = (
                f"Your turn is approaching. Please prepare to proceed to the consultation room. "
                f"Your ticket number is {patient_checkin.ticket_number}."
            )
            await self.notification_service.send_queue_reminder(
                patient_id=patient_checkin.patient_id,
                appointment_id=patient_checkin.appointment_id,
                message=notification_message
            )
            print(f"Notification sent to patient {patient_checkin.patient_id}: {notification_message}")
        else:
            print(f"No patient found for target ticket sequence {target_ticket_sequence} for schedule {schedule_id}.")

    async def handle_no_shows(self):
        """
        Identifies and processes no-show appointments.
        This method is intended to be run as a periodic background job.
        """
        # Define the time threshold for no-show (e.g., 3 minutes)
        no_show_threshold = datetime.now() - timedelta(minutes=3)

        # Query for VisitCall records that were called more than 3 minutes ago
        # and whose associated appointment is still in 'checked_in' or 'waiting' status.
        no_show_calls = self.visit_call_crud.get_potential_no_shows(no_show_threshold)

        for call in no_show_calls:
            appointment = self.appointment_crud.get(self.db, call.appointment_id) # Corrected method call

            if appointment and appointment.status in ["checked_in", "waiting"]:
                # Mark appointment as no_show
                self.appointment_crud.update_status(self.db, # Corrected method call
                    appointment_id=appointment.appointment_id,
                    new_status="no_show"
                )
                # Create an infraction record (D4)
                await self.infraction_service.create_infraction(
                    patient_id=appointment.patient_id,
                    appointment_id=appointment.appointment_id,
                    infraction_type="no_show"
                )
                print(f"Appointment {appointment.appointment_id} marked as no_show. Infraction created.")
                
    async def mark_no_show(self, checkin_id: UUID):
        checkin = self.db.query(Checkin).filter(Checkin.checkin_id == checkin_id).first()
        if not checkin:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="報到記錄未找到。")

        # Update Checkin status
        checkin.status = "no_show" # Assuming Checkin model has a status field
        self.db.add(checkin)
        self.db.commit()
        self.db.refresh(checkin)

        # Update Appointment status
        appointment = self.appointment_crud.get(self.db, checkin.appointment_id)
        if appointment:
            self.appointment_crud.update_status(self.db, appointment_id=appointment.appointment_id, new_status="no_show")
            # Create an infraction record
            await self.infraction_service.create_infraction(
                patient_id=appointment.patient_id,
                appointment_id=appointment.appointment_id,
                infraction_type="no_show"
            )
        
        return {"message": "病患已標記為未到。"}

    async def re_check_in(self, checkin_id: UUID):
        checkin = self.db.query(Checkin).filter(Checkin.checkin_id == checkin_id).first()
        if not checkin:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="報到記錄未找到。")
        
        if checkin.status != "no_show":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="病患未被標記為未到，無法補報到。")

        room_day = self.db.query(RoomDay).filter(RoomDay.schedule_id == checkin.schedule_id).first()
        if not room_day:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="診間尚未開放或已關閉。")

        # Update Checkin status back to checked_in
        checkin.status = "checked_in"
        self.db.add(checkin)
        self.db.flush() # Flush to make checkin.ticket_sequence available for re-sequencing

        # Get active waiting patients (excluding the re-checking-in patient's old sequence if it was still active)
        active_waiting_patients = self.db.query(Checkin).filter(
            Checkin.schedule_id == checkin.schedule_id,
            Checkin.status == "checked_in",
            Checkin.ticket_sequence > room_day.current_called_sequence,
            Checkin.checkin_id != checkin_id # Exclude the current patient from the list for insertion logic
        ).order_by(Checkin.ticket_sequence).all()

        new_ticket_sequence = None

        if len(active_waiting_patients) > 3:
            # Insert after the 3rd waiting patient (index 2)
            target_sequence = active_waiting_patients[2].ticket_sequence
            new_ticket_sequence = target_sequence + 1

            # Shift subsequent patients
            for patient_to_shift in active_waiting_patients:
                if patient_to_shift.ticket_sequence >= new_ticket_sequence:
                    patient_to_shift.ticket_sequence += 1
                    self.db.add(patient_to_shift)
            self.db.flush() # Flush shifted patients

        else:
            # Insert at the end of the queue
            new_ticket_sequence = room_day.next_sequence
            room_day.next_sequence += 1
            self.db.add(room_day)
            self.db.flush() # Flush room_day update

        checkin.ticket_sequence = new_ticket_sequence
        self.db.add(checkin)
        self.db.commit()
        self.db.refresh(checkin)

        # Update Appointment status back to checked_in
        appointment = self.appointment_crud.get(self.db, checkin.appointment_id)
        if appointment:
            self.appointment_crud.update_status(self.db, appointment_id=appointment.appointment_id, new_status="checked_in")
        
        return {"message": "病患已成功補報到。", "new_ticket_number": checkin.ticket_number, "new_ticket_sequence": checkin.ticket_sequence}