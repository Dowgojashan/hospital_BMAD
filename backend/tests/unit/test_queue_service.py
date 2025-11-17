import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timedelta, date
from uuid import uuid4

from app.services.queue_service import QueueService
from app.crud.visit_call_crud import VisitCallCRUD
from app.crud.crud_appointment import AppointmentCRUD # Renamed to AppointmentCRUD
from app.services.infraction_service import InfractionService
from app.models.visit_call import VisitCall
from app.models.appointment import Appointment
from app.models.patient import Patient

@pytest.fixture
def mock_db_session():
    return MagicMock()

@pytest.fixture
def mock_visit_call_crud():
    crud = MagicMock()
    crud.get_potential_no_shows = MagicMock()
    return crud

@pytest.fixture
def mock_appointment_crud():
    crud = MagicMock()
    crud.get = MagicMock()
    crud.update_status = MagicMock() # Corrected method name
    return crud

@pytest.fixture
def mock_infraction_service(mock_db_session):
    service = InfractionService(mock_db_session)
    service.create_infraction = AsyncMock()
    return service

@pytest.fixture
def queue_service(mock_db_session, mock_visit_call_crud, mock_appointment_crud, mock_infraction_service):
    service = QueueService(mock_db_session)
    service.visit_call_crud = mock_visit_call_crud
    service.appointment_crud = mock_appointment_crud
    service.infraction_service = mock_infraction_service
    return service

@pytest.mark.asyncio
async def test_handle_no_shows_marks_appointment_and_creates_infraction(queue_service, mock_visit_call_crud, mock_appointment_crud, mock_infraction_service):
    # Setup test data
    patient_id = uuid4()
    appointment_id = uuid4()
    doctor_id = uuid4()
    room_id = uuid4()

    # Create a mock patient
    mock_patient = Patient(
        patient_id=patient_id,
        card_number="1234567890",
        name="Test Patient",
        password_hash="hashed_password",
        dob=date(1990, 1, 1),
        phone="123-456-7890",
        email="test@example.com"
    )

    # Create a mock appointment
    mock_appointment = Appointment(
        appointment_id=appointment_id,
        patient_id=patient_id,
        doctor_id=doctor_id,
        date=date.today(),
        time_period="morning",
        status="checked_in"
    )

    # Create a mock visit call that is older than 3 minutes
    mock_visit_call = VisitCall(
        call_id=uuid4(),
        appointment_id=appointment_id,
        ticket_sequence=1,
        ticket_number="A1",
        called_at=datetime.now() - timedelta(minutes=5),
        called_by=uuid4(),
        call_type="call",
        call_status="active"
    )

    # Configure mocks
    mock_visit_call_crud.get_potential_no_shows.return_value = [mock_visit_call]
    mock_appointment_crud.get.return_value = mock_appointment # Corrected method name
    mock_appointment_crud.update_status.return_value = None # No need to return anything specific # Corrected method name
    mock_infraction_service.create_infraction.return_value = None # No need to return anything specific

    # Call the method under test
    await queue_service.handle_no_shows()

    # Assertions
    mock_visit_call_crud.get_potential_no_shows.assert_called_once()
    mock_appointment_crud.get.assert_called_once_with(queue_service.db, appointment_id) # Corrected method name and added db
    mock_appointment_crud.update_status.assert_called_once_with(
        queue_service.db, # Pass db as positional argument
        appointment_id=appointment_id,
        new_status="no_show"
    )
    mock_infraction_service.create_infraction.assert_called_once_with(
        patient_id=patient_id,
        appointment_id=appointment_id,
        infraction_type="no_show"
    )

@pytest.mark.asyncio
async def test_handle_no_shows_does_nothing_if_no_potential_no_shows(queue_service, mock_visit_call_crud, mock_appointment_crud, mock_infraction_service):
    mock_visit_call_crud.get_potential_no_shows.return_value = []

    await queue_service.handle_no_shows()

    mock_visit_call_crud.get_potential_no_shows.assert_called_once()
    mock_appointment_crud.get.assert_not_called() # Corrected method name
    mock_appointment_crud.update_status.assert_not_called() # Corrected method name
    mock_infraction_service.create_infraction.assert_not_called()

@pytest.mark.asyncio
async def test_handle_no_shows_does_nothing_if_appointment_status_not_checked_in_or_waiting(queue_service, mock_visit_call_crud, mock_appointment_crud, mock_infraction_service):
    patient_id = uuid4()
    appointment_id = uuid4()
    doctor_id = uuid4()
    room_id = uuid4()

    mock_appointment = Appointment(
        appointment_id=appointment_id,
        patient_id=patient_id,
        doctor_id=doctor_id,
        date=date.today(),
        time_period="morning",
        status="completed" # Already completed
    )

    mock_visit_call = VisitCall(
        call_id=uuid4(),
        appointment_id=appointment_id,
        ticket_sequence=1,
        ticket_number="A1",
        called_at=datetime.now() - timedelta(minutes=5),
        called_by=uuid4(),
        call_type="call",
        call_status="active"
    )

    mock_visit_call_crud.get_potential_no_shows.return_value = [mock_visit_call]
    mock_appointment_crud.get.return_value = mock_appointment # Corrected method name

    await queue_service.handle_no_shows()

    mock_visit_call_crud.get_potential_no_shows.assert_called_once()
    mock_appointment_crud.get.assert_called_once_with(queue_service.db, appointment_id) # Corrected method name and added db
    mock_appointment_crud.update_status.assert_not_called() # Corrected method name
    mock_infraction_service.create_infraction.assert_not_called()