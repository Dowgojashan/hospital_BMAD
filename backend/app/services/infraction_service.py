from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from datetime import date, timedelta

from app.crud.infraction_crud import InfractionCRUD
from app.crud.crud_user import update_patient_suspended_until
from app.schemas.infraction import InfractionCreate

class InfractionService:
    NO_SHOW_PENALTY_THRESHOLD = 3
    PENALTY_DURATION_DAYS = 180

    def __init__(self, db: Session):
        self.db = db
        self.infraction_crud = InfractionCRUD(db)

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
            no_show_count = self.infraction_crud.count_infractions_by_patient_and_type(
                patient_id=patient_id,
                infraction_type="no_show"
            )

            if no_show_count >= self.NO_SHOW_PENALTY_THRESHOLD:
                # Apply penalty
                penalty_until = date.today() + timedelta(days=self.PENALTY_DURATION_DAYS)
                
                # Update patient's suspended_until field
                update_patient_suspended_until(
                    self.db,
                    patient_id=patient_id,
                    suspended_until=penalty_until
                )

                # Mark the current infraction and all previous no-show infractions as penalty_applied
                # This prevents recounting old infractions for new penalties
                all_no_show_infractions = self.infraction_crud.get_all_by_patient(patient_id)
                for infraction in all_no_show_infractions:
                    if infraction.infraction_type == "no_show" and not infraction.penalty_applied:
                        self.infraction_crud.update_penalty_status(
                            infraction_id=infraction.infraction_id,
                            penalty_applied=True,
                            penalty_until=penalty_until
                        )
                print(f"Patient {patient_id} reached {self.NO_SHOW_PENALTY_THRESHOLD} no-shows. Suspended until {penalty_until}.")
        
        print(f"Infraction created: {new_infraction.infraction_id} for patient {patient_id}, type {infraction_type}.")
        return new_infraction