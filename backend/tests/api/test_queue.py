import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import uuid4
from datetime import date, timedelta

from app.main import app
from app.models.room_day import RoomDay
from app.models.checkin import Checkin
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.services.notification_service import NotificationService

# Assuming client and db_session fixtures are available from conftest.py
# For example:
# @pytest.fixture(scope="module")
# def client():
#     with TestClient(app) as c:
#         yield c
#
# @pytest.fixture(scope="function")
# def db_session():
#     # Setup test database session
#     yield session
#     # Teardown test database session


@pytest.fixture
def mock_notification_service(mocker):
    """Mocks the NotificationService to prevent actual notifications during tests."""
    mock_instance = mocker.patch('app.services.queue_service.NotificationService').return_value
    mock_instance.send_queue_reminder = mocker.AsyncMock()
    return mock_instance

def test_call_next_ticket_success_with_notification(client: TestClient, db: Session, mock_notification_service):
    room_id = uuid4()
    patient_id = uuid4()
    appointment_id = uuid4()

    # Create a patient
    patient = Patient(patient_id=patient_id, name="Test Patient", card_number="1234567890", password_hash="hashed_password", dob=date(1990, 1, 1), phone="123-456-7890", email="test@example.com")
    db.add(patient)
    db.commit()
    db.refresh(patient)

    # Create an appointment
    appointment = Appointment(
        appointment_id=appointment_id,
        patient_id=patient_id,
        doctor_id=room_id, # Assuming room_id in test is actually doctor_id
        date=date.today(),
        time_period="morning", # Add time_period as it's nullable=False
        status="scheduled"
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    # Pre-populate RoomDay with next_sequence and current_called_sequence
    room_day = RoomDay(
        room_day_id=uuid4(),
        room_id=room_id,
        date=date.today(),
        next_sequence=5, # Next check-in would be 5
        current_called_sequence=1 # Last called was 1
    )
    db.add(room_day)
    db.commit()
    db.refresh(room_day)

    # Create a check-in record for the target patient (called_ticket_sequence + 2)
    target_ticket_sequence = 1 + 2 # If 1 is called, 3 is target
    checkin = Checkin(
        checkin_id=uuid4(),
        appointment_id=appointment_id,
        patient_id=patient_id,
        checkin_time=date.today(),
        checkin_method="online",
        ticket_sequence=target_ticket_sequence,
        ticket_number=f"A{target_ticket_sequence}"
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)

    response = client.post(
        f"/api/v1/clinics/{room_id}/call-next",
        json={"called_ticket_sequence": 1}
    )

    assert response.status_code == 200
    assert response.json()["message"] == f"Ticket 1 called for room {room_id}. Queue updated."

    # Verify RoomDay was updated
    updated_room_day = db.query(RoomDay).filter_by(room_id=room_id, date=date.today()).first()
    assert updated_room_day.current_called_sequence == 1

    # Verify notification service was called
    mock_notification_service.send_queue_reminder.assert_called_once_with(
        patient_id=patient_id,
        appointment_id=appointment_id,
        message=f"Your turn is approaching. Please prepare to proceed to the consultation room. Your ticket number is A{target_ticket_sequence}."
    )

def test_call_next_ticket_no_notification_if_target_not_found(client: TestClient, db: Session, mock_notification_service):
    room_id = uuid4()
    # Pre-populate RoomDay
    room_day = RoomDay(
        room_day_id=uuid4(),
        room_id=room_id,
        date=date.today(),
        next_sequence=1,
        current_called_sequence=0
    )
    db.add(room_day)
    db.commit()
    db.refresh(room_day)

    response = client.post(
        f"/api/v1/clinics/{room_id}/call-next",
        json={"called_ticket_sequence": 10}
    )

    assert response.status_code == 200
    assert response.json()["message"] == f"Ticket 10 called for room {room_id}. Queue updated."

    # Verify RoomDay was updated
    updated_room_day = db.query(RoomDay).filter_by(room_id=room_id, date=date.today()).first()
    db.refresh(updated_room_day) # Refresh the object to get the latest state
    assert updated_room_day.current_called_sequence == 10
    # Verify notification service was NOT called
    mock_notification_service.send_queue_reminder.assert_not_called()

def test_call_next_ticket_room_day_created_if_not_exists(client: TestClient, db: Session, mock_notification_service):
    room_id = uuid4()
    # No RoomDay record initially

    response = client.post(
        f"/api/v1/clinics/{room_id}/call-next",
        json={"called_ticket_sequence": 1}
    )

    assert response.status_code == 200
    assert response.json()["message"] == f"Ticket 1 called for room {room_id}. Queue updated."

    # Verify RoomDay was created and updated
    created_room_day = db.query(RoomDay).filter_by(room_id=room_id, date=date.today()).first()
    assert created_room_day is not None
    assert created_room_day.current_called_sequence == 1
    assert created_room_day.next_sequence == 1 # Default value

    mock_notification_service.send_queue_reminder.assert_not_called() # No checkin for target ticket