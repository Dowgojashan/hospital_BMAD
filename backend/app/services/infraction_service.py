from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from datetime import date, timedelta, datetime
import pytz # Import pytz

from app.crud.infraction_crud import InfractionCRUD
from app.crud.crud_user import update_patient_suspended_until
from app.schemas.infraction import InfractionCreate

class InfractionService:
    NO_SHOW_PENALTY_THRESHOLD = 3
    PENALTY_DURATION_DAYS = 90 # Changed from 180 to 90
    NO_SHOW_COUNT_WINDOW_DAYS = 90 # New constant for the counting window

    def __init__(self, db: Session):
        self.db = db
        self.infraction_crud = InfractionCRUD(db)

    def _get_taiwan_current_date(self):
        """Helper to get the current date in Taiwan time zone."""
        taiwan_tz = pytz.timezone('Asia/Taipei')
        return datetime.now(taiwan_tz).date()

    async def create_infraction(self, patient_id: UUID, appointment_id: Optional[UUID], infraction_type: str):
        """
        Creates an infraction record and applies a penalty if the threshold is met.
        """
        infraction_in = InfractionCreate(
            patient_id=patient_id,
            appointment_id=appointment_id,
            infraction_type=infraction_type,
            notes=f"Automatically created for {infraction_type}."
        )
        new_infraction = self.infraction_crud.create(infraction_in)

        if infraction_type == "no_show":
            taiwan_today = self._get_taiwan_current_date()
            ninety_days_ago = taiwan_today - timedelta(days=self.NO_SHOW_COUNT_WINDOW_DAYS - 1) # -1 because it's inclusive

            no_show_count = self.infraction_crud.count_infractions_in_period(
                patient_id=patient_id,
                infraction_type="no_show",
                start_date=ninety_days_ago,
                end_date=taiwan_today
            )

            if no_show_count >= self.NO_SHOW_PENALTY_THRESHOLD:
                # Apply penalty
                penalty_until = taiwan_today + timedelta(days=self.PENALTY_DURATION_DAYS)
                
                # Update patient's suspended_until field
                update_patient_suspended_until(
                    self.db,
                    patient_id=patient_id,
                    suspended_until=penalty_until
                )

                print(f"Patient {patient_id} reached {self.NO_SHOW_PENALTY_THRESHOLD} no-shows within {self.NO_SHOW_COUNT_WINDOW_DAYS} days. Suspended until {penalty_until}.")
        
        print(f"Infraction created: {new_infraction.infraction_id} for patient {patient_id}, type {infraction_type}.")
        return new_infraction