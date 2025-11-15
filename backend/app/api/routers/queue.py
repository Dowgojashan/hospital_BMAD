from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any
from datetime import date
from uuid import UUID # Import UUID

from ...schemas.queue import CallNextRequest
from ...db.session import get_db
from ...services.queue_service import QueueService
from ...services.checkin_service import CheckinService # Import CheckinService
from ...api.dependencies import get_current_patient # Import get_current_patient

router = APIRouter()

@router.get("/checkin/queue/{appointment_id}", response_model=dict, status_code=status.HTTP_200_OK)
async def get_patient_queue_status(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_patient: dict = Depends(get_current_patient)
) -> Any:
    """
    Retrieve the current queue status for a patient's appointment.
    """
    patient_id = current_patient["patient_id"]
    try:
        queue_service = QueueService(db)
        status_info = await queue_service.get_patient_queue_status(
            appointment_id=appointment_id,
            patient_id=patient_id
        )
        return status_info
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/checkin/{appointment_id}", response_model=dict, status_code=status.HTTP_200_OK)
async def patient_online_checkin(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_patient: dict = Depends(get_current_patient)
) -> Any:
    """
    Endpoint for patients to perform online check-in for a specific appointment.
    """
    patient_id = current_patient["patient_id"]
    try:
        checkin_service = CheckinService(db) # Instantiate CheckinService here
        result = checkin_service.create_checkin(
            db=db,
            patient_id=patient_id,
            appointment_id=appointment_id,
            checkin_method="online"
        )
        return {"message": "報到成功！", "checkin_info": result}
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/schedules/{schedule_id}/call-next", response_model=dict, status_code=status.HTTP_200_OK)
async def call_next_ticket(
    schedule_id: UUID,
    request: CallNextRequest,
    db: Session = Depends(get_db),
) -> Any:
    """
    Endpoint for clinic staff to signal that a ticket number has been called.
    Triggers real-time queue reminders for patients whose turn is approaching.
    """
    try:
        queue_service = QueueService(db)
        await queue_service.call_next(
            schedule_id=schedule_id,
            called_ticket_sequence=request.called_ticket_sequence
        )
        return {"message": f"Ticket {request.called_ticket_sequence} called for schedule {schedule_id}. Queue updated."}
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc() # Print the full traceback
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
