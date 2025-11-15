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
        # 1. Get the check-in record for the appointment
        checkin_record = self.db.query(Checkin).filter(
            Checkin.appointment_id == appointment_id,
            Checkin.patient_id == patient_id
        ).first()

        if not checkin_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="未找到報到記錄。"
            )

        # 2. Get the Appointment record to find the schedule_id
        appointment_record = self.db.query(Appointment).filter(
            Appointment.appointment_id == checkin_record.appointment_id
        ).first()

        if not appointment_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="未找到預約記錄。"
            )

        # 3. Get the RoomDay record using schedule_id
        room_day = self.db.query(RoomDay).filter(
            RoomDay.schedule_id == appointment_record.schedule_id
        ).first()

        if not room_day:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="未找到診間當日資訊。"
            )

        current_called_sequence = room_day.current_called_sequence
        my_ticket_sequence = checkin_record.ticket_sequence

        # Calculate current number, my position, waiting count
        current_number = f"A{current_called_sequence:03d}" # Assuming 'A' prefix for ticket numbers
        my_position = f"A{my_ticket_sequence:03d}"

        waiting_count = 0
        estimated_wait_time = 0

        if my_ticket_sequence > current_called_sequence:
            waiting_count = my_ticket_sequence - current_called_sequence -1
            estimated_wait_time = waiting_count * 10 # 10 minutes per patient

        return {
            "current_number": current_number,
            "my_position": my_position,
            "waiting_count": waiting_count,
            "estimated_wait_time": estimated_wait_time,
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