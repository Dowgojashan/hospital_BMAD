import pytest
from unittest.mock import MagicMock, patch
from datetime import date, datetime, timedelta
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.services.checkin_service import CheckinService
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.room_day import RoomDay
from app.schemas.room_day import RoomDayCreate

# Fixtures for common test data
@pytest.fixture
def mock_db_session():
    return MagicMock(spec=Session)

@pytest.fixture(scope="function")
def mock_patient():
    return Patient(
        patient_id=uuid.uuid4(),
        card_number="12345",
        name="Test Patient",
        password_hash="hashed",
        dob=date(2000, 1, 1),
        phone="1234567890",
        email="test@example.com",
        is_verified=True,
        suspended_until=None
    )

@pytest.fixture(scope="function")
def mock_suspended_patient(mock_patient):
    mock_patient.suspended_until = date.today() + timedelta(days=10)
    return mock_patient

@pytest.fixture(scope="function")
def mock_appointment(mock_patient):
    return Appointment(
        appointment_id=uuid.uuid4(),
        patient_id=mock_patient.patient_id,
        doctor_id=uuid.uuid4(),
        date=date.today(),
        time_period="morning",
        status="scheduled"
    )

@pytest.fixture(scope="function")
def mock_confirmed_appointment(mock_appointment):
    mock_appointment.status = "confirmed"
    return mock_appointment

@pytest.fixture(scope="function")
def mock_cancelled_appointment(mock_appointment):
    mock_appointment.status = "cancelled"
    return mock_appointment

@pytest.fixture(scope="function")
def mock_room_day():
    return RoomDay(
        room_day_id=uuid.uuid4(),
        room_id=uuid.uuid4(),
        date=date.today(),
        next_sequence=1,
        current_called_sequence=None
    )

# Test cases for CheckinService
class TestCheckinService:
    @patch('app.services.checkin_service.get_patient')
    @patch('app.services.checkin_service.crud_appointment')
    @patch('app.services.checkin_service.crud_room_day')
    @patch('app.services.checkin_service.crud_checkin')
    def test_successful_online_checkin(self, mock_crud_checkin, mock_crud_room_day, mock_crud_appointment, mock_get_patient, mock_db_session, mock_patient, mock_appointment, mock_room_day):
        # Arrange
        test_patient_id = uuid.uuid4()
        test_appointment_id = uuid.uuid4()
        test_doctor_id = uuid.uuid4()

        # Create concrete Patient and Appointment objects for mocks
        patient_obj = Patient(
            patient_id=test_patient_id,
            card_number="12345",
            name="Test Patient",
            password_hash="hashed",
            dob=date(2000, 1, 1),
            phone="1234567890",
            email="test@example.com",
            is_verified=True,
            suspended_until=None
        )
        appointment_obj = Appointment(
            appointment_id=test_appointment_id,
            patient_id=test_patient_id,
            doctor_id=test_doctor_id,
            date=date.today(),
            time_period="morning",
            status="scheduled"
        )
        room_day_obj = RoomDay(
            room_day_id=uuid.uuid4(),
            room_id=test_doctor_id,
            date=date.today(),
            next_sequence=1,
            current_called_sequence=None
        )

        mock_get_patient.return_value = patient_obj
        mock_crud_appointment.get.return_value = appointment_obj
        
        # Mock update_status to actually change the status of the appointment_obj
        def mock_update_status(db, appointment_id, new_status):
            appointment_obj.status = new_status
            return appointment_obj
        mock_crud_appointment.update_status.side_effect = mock_update_status

        mock_crud_room_day.get_by_room_id_and_date.return_value = room_day_obj
        mock_crud_room_day.get_room_day_for_update.return_value = room_day_obj # Return same mock for lock
        mock_crud_checkin.create.return_value = MagicMock(ticket_number="001")
        
        # Mock the increment operation on the RoomDay object
        def mock_increment_next_sequence(db, db_obj):
            db_obj.next_sequence += 1
            return db_obj
        mock_crud_room_day.update_next_sequence.side_effect = mock_increment_next_sequence

        service = CheckinService()

        # Act
        result = service.create_checkin(
            db=mock_db_session,
            patient_id=test_patient_id,
            appointment_id=test_appointment_id,
            checkin_method="online"
        )

        # Assert
        mock_get_patient.assert_called_once_with(mock_db_session, patient_id=test_patient_id)
        mock_crud_appointment.get.assert_called_once_with(mock_db_session, appointment_id=test_appointment_id)
        mock_crud_appointment.update_status.assert_called_once_with(mock_db_session, appointment_id=test_appointment_id, new_status="checked_in")
        mock_crud_room_day.get_by_room_id_and_date.assert_called_once()
        mock_crud_room_day.get_room_day_for_update.assert_called_once()
        mock_crud_checkin.create.assert_called_once()
        mock_db_session.commit.assert_called_once()
        assert result["ticket_number"] == "001"
        assert result["status"] == "checked_in"

    @patch('app.services.checkin_service.get_patient')
    @patch('app.services.checkin_service.crud_appointment')
    def test_checkin_patient_not_found(self, mock_crud_appointment, mock_get_patient, mock_db_session, mock_appointment):
        # Arrange
        mock_get_patient.return_value = None
        test_patient_id = uuid.uuid4()
        test_appointment_id = uuid.uuid4()
        
        # Create concrete Appointment object for mock
        appointment_obj = Appointment(
            appointment_id=test_appointment_id,
            patient_id=uuid.uuid4(), # Different patient_id
            doctor_id=mock_appointment.doctor_id,
            date=mock_appointment.date,
            time_period=mock_appointment.time_period,
            status=mock_appointment.status
        )

        mock_crud_appointment.get.return_value = appointment_obj
        service = CheckinService()

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            service.create_checkin(
                db=mock_db_session,
                patient_id=test_patient_id,
                appointment_id=test_appointment_id,
                checkin_method="online"
            )
        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Patient not found" in exc_info.value.detail

    @patch('app.services.checkin_service.get_patient')
    @patch('app.services.checkin_service.crud_appointment')
    def test_checkin_appointment_not_found(self, mock_crud_appointment, mock_get_patient, mock_db_session, mock_patient):
        # Arrange
        test_patient_id = uuid.uuid4()
        test_appointment_id = uuid.uuid4()

        # Create concrete Patient object for mock
        patient_obj = Patient(
            patient_id=test_patient_id,
            card_number="12345",
            name="Test Patient",
            password_hash="hashed",
            dob=date(2000, 1, 1),
            phone="1234567890",
            email="test@example.com",
            is_verified=True,
            suspended_until=None
        )

        mock_get_patient.return_value = patient_obj
        mock_crud_appointment.get.return_value = None # Appointment is None
        service = CheckinService()

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            service.create_checkin(
                db=mock_db_session,
                patient_id=test_patient_id,
                appointment_id=test_appointment_id,
                checkin_method="online"
            )
        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Appointment not found" in exc_info.value.detail

    @patch('app.services.checkin_service.get_patient')
    @patch('app.services.checkin_service.crud_appointment')
    def test_checkin_appointment_does_not_belong_to_patient(self, mock_crud_appointment, mock_get_patient, mock_db_session, mock_patient, mock_appointment):
        # Arrange
        test_patient_id = uuid.uuid4()
        test_appointment_id = uuid.uuid4()
        test_doctor_id = uuid.uuid4()
        
        # Create concrete Patient and Appointment objects for mocks
        patient_obj = Patient(
            patient_id=test_patient_id,
            card_number="12345",
            name="Test Patient",
            password_hash="hashed",
            dob=date(2000, 1, 1),
            phone="1234567890",
            email="test@example.com",
            is_verified=True,
            suspended_until=None
        )
        appointment_obj = Appointment(
            appointment_id=test_appointment_id,
            patient_id=uuid.uuid4(), # Mismatch patient_id
            doctor_id=test_doctor_id,
            date=date.today(),
            time_period="morning",
            status="scheduled"
        )

        mock_get_patient.return_value = patient_obj
        mock_crud_appointment.get.return_value = appointment_obj
        service = CheckinService()

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            service.create_checkin(
                db=mock_db_session,
                patient_id=test_patient_id,
                appointment_id=test_appointment_id,
                checkin_method="online"
            )
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Appointment does not belong to patient" in exc_info.value.detail

    @patch('app.services.checkin_service.get_patient')
    @patch('app.services.checkin_service.crud_appointment')
    def test_checkin_suspended_patient_online(self, mock_crud_appointment, mock_get_patient, mock_db_session, mock_suspended_patient, mock_appointment):
        # Arrange
        test_patient_id = uuid.uuid4()
        test_appointment_id = uuid.uuid4()
        test_doctor_id = uuid.uuid4()
        
        # Create concrete Suspended Patient and Appointment objects for mocks
        suspended_patient_obj = Patient(
            patient_id=test_patient_id,
            card_number="12345",
            name="Suspended Patient",
            password_hash="hashed",
            dob=date(2000, 1, 1),
            phone="1234567890",
            email="suspended@example.com",
            is_verified=True,
            suspended_until=date.today() + timedelta(days=10)
        )
        appointment_obj = Appointment(
            appointment_id=test_appointment_id,
            patient_id=test_patient_id,
            doctor_id=test_doctor_id,
            date=date.today(),
            time_period="morning",
            status="scheduled"
        )

        mock_get_patient.return_value = suspended_patient_obj
        mock_crud_appointment.get.return_value = appointment_obj
        service = CheckinService()

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            service.create_checkin(
                db=mock_db_session,
                patient_id=test_patient_id,
                appointment_id=test_appointment_id,
                checkin_method="online"
            )
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "已被限制線上報到" in exc_info.value.detail

    @patch('app.services.checkin_service.get_patient')
    @patch('app.services.checkin_service.crud_appointment')
    @patch('app.services.checkin_service.crud_room_day')
    @patch('app.services.checkin_service.crud_checkin')
    def test_checkin_suspended_patient_onsite_allowed(self, mock_crud_checkin, mock_crud_room_day, mock_crud_appointment, mock_get_patient, mock_db_session, mock_suspended_patient, mock_appointment, mock_room_day):
        # Arrange
        test_patient_id = uuid.uuid4()
        test_appointment_id = uuid.uuid4()
        test_doctor_id = uuid.uuid4()

        # Create concrete Suspended Patient and Appointment objects for mocks
        suspended_patient_obj = Patient(
            patient_id=test_patient_id,
            card_number="12345",
            name="Suspended Patient",
            password_hash="hashed",
            dob=date(2000, 1, 1),
            phone="1234567890",
            email="suspended@example.com",
            is_verified=True,
            suspended_until=date.today() + timedelta(days=10)
        )
        appointment_obj = Appointment(
            appointment_id=test_appointment_id,
            patient_id=test_patient_id,
            doctor_id=test_doctor_id,
            date=date.today(),
            time_period="morning",
            status="scheduled"
        )
        room_day_obj = RoomDay(
            room_day_id=uuid.uuid4(),
            room_id=test_doctor_id,
            date=date.today(),
            next_sequence=1,
            current_called_sequence=None
        )

        mock_get_patient.return_value = suspended_patient_obj
        mock_crud_appointment.get.return_value = appointment_obj
        
        # Mock update_status to actually change the status of the appointment_obj
        def mock_update_status(db, appointment_id, new_status):
            appointment_obj.status = new_status
            return appointment_obj
        mock_crud_appointment.update_status.side_effect = mock_update_status

        mock_crud_room_day.get_by_room_id_and_date.return_value = room_day_obj
        mock_crud_room_day.get_room_day_for_update.return_value = room_day_obj # Return same mock for lock
        mock_crud_checkin.create.return_value = MagicMock(ticket_number="001")
        
        def mock_increment_next_sequence(db, db_obj):
            db_obj.next_sequence += 1
            return db_obj
        mock_crud_room_day.update_next_sequence.side_effect = mock_increment_next_sequence

        service = CheckinService()

        # Act
        result = service.create_checkin(
            db=mock_db_session,
            patient_id=test_patient_id,
            appointment_id=test_appointment_id,
            checkin_method="onsite"
        )

        # Assert
        assert result["ticket_number"] == "001"
        assert result["status"] == "checked_in"
        mock_db_session.commit.assert_called_once() # Should commit for onsite checkin

    @patch('app.services.checkin_service.get_patient')
    @patch('app.services.checkin_service.crud_appointment')
    def test_checkin_invalid_appointment_status(self, mock_crud_appointment, mock_get_patient, mock_db_session, mock_patient, mock_cancelled_appointment):
        # Arrange
        test_patient_id = uuid.uuid4()
        test_appointment_id = uuid.uuid4()
        test_doctor_id = uuid.uuid4()
        
        # Create concrete Patient and Appointment objects for mocks
        patient_obj = Patient(
            patient_id=test_patient_id,
            card_number="12345",
            name="Test Patient",
            password_hash="hashed",
            dob=date(2000, 1, 1),
            phone="1234567890",
            email="test@example.com",
            is_verified=True,
            suspended_until=None
        )
        appointment_obj = Appointment(
            appointment_id=test_appointment_id,
            patient_id=test_patient_id,
            doctor_id=test_doctor_id,
            date=date.today(),
            time_period="morning",
            status="cancelled" # Explicitly set status
        )

        mock_get_patient.return_value = patient_obj
        mock_crud_appointment.get.return_value = appointment_obj
        service = CheckinService()

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            service.create_checkin(
                db=mock_db_session,
                patient_id=test_patient_id,
                appointment_id=test_appointment_id,
                checkin_method="online"
            )
        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "預約狀態為 'cancelled'，無法報到。" in exc_info.value.detail

    @patch('app.services.checkin_service.get_patient')
    @patch('app.services.checkin_service.crud_appointment')
    def test_checkin_appointment_not_today(self, mock_crud_appointment, mock_get_patient, mock_db_session, mock_patient, mock_appointment):
        # Arrange
        test_patient_id = uuid.uuid4()
        test_appointment_id = uuid.uuid4()
        test_doctor_id = uuid.uuid4()
        
        # Create concrete Patient and Appointment objects for mocks
        patient_obj = Patient(
            patient_id=test_patient_id,
            card_number="12345",
            name="Test Patient",
            password_hash="hashed",
            dob=date(2000, 1, 1),
            phone="1234567890",
            email="test@example.com",
            is_verified=True,
            suspended_until=None
        )
        appointment_obj = Appointment(
            appointment_id=test_appointment_id,
            patient_id=test_patient_id,
            doctor_id=test_doctor_id,
            date=date.today() + timedelta(days=1), # Future appointment
            time_period="morning",
            status="scheduled"
        )

        mock_get_patient.return_value = patient_obj
        mock_crud_appointment.get.return_value = appointment_obj
        service = CheckinService()

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            service.create_checkin(
                db=mock_db_session,
                patient_id=test_patient_id,
                appointment_id=test_appointment_id,
                checkin_method="online"
            )
        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "只能在預約當天報到。" in exc_info.value.detail

    @patch('app.services.checkin_service.get_patient')
    @patch('app.services.checkin_service.crud_appointment')
    @patch('app.services.checkin_service.crud_room_day')
    @patch('app.services.checkin_service.crud_checkin')
    def test_checkin_room_day_creation_if_not_exists(self, mock_crud_checkin, mock_crud_room_day, mock_crud_appointment, mock_get_patient, mock_db_session, mock_patient, mock_appointment, mock_room_day):
        # Arrange
        test_patient_id = uuid.uuid4()
        test_appointment_id = uuid.uuid4()
        test_doctor_id = uuid.uuid4()

        # Create concrete Patient and Appointment objects for mocks
        patient_obj = Patient(
            patient_id=test_patient_id,
            card_number="12345",
            name="Test Patient",
            password_hash="hashed",
            dob=date(2000, 1, 1),
            phone="1234567890",
            email="test@example.com",
            is_verified=True,
            suspended_until=None
        )
        appointment_obj = Appointment(
            appointment_id=test_appointment_id,
            patient_id=test_patient_id,
            doctor_id=test_doctor_id,
            date=date.today(),
            time_period="morning",
            status="scheduled"
        )
        room_day_obj = RoomDay(
            room_day_id=uuid.uuid4(),
            room_id=test_doctor_id,
            date=date.today(),
            next_sequence=1,
            current_called_sequence=None
        )

        mock_get_patient.return_value = patient_obj
        mock_crud_appointment.get.return_value = appointment_obj
        
        # Mock update_status to actually change the status of the appointment_obj
        def mock_update_status(db, appointment_id, new_status):
            appointment_obj.status = new_status
            return appointment_obj
        mock_crud_appointment.update_status.side_effect = mock_update_status

        mock_crud_room_day.get_by_room_id_and_date.return_value = None # RoomDay does not exist
        mock_crud_room_day.create.return_value = room_day_obj # Mock creation
        mock_crud_room_day.get_room_day_for_update.return_value = room_day_obj # Mock after creation and lock
        mock_crud_checkin.create.return_value = MagicMock(ticket_number="001")

        def mock_increment_next_sequence(db, db_obj):
            db_obj.next_sequence += 1
            return db_obj
        mock_crud_room_day.update_next_sequence.side_effect = mock_increment_next_sequence

        service = CheckinService()

        # Act
        result = service.create_checkin(
            db=mock_db_session,
            patient_id=test_patient_id,
            appointment_id=test_appointment_id,
            checkin_method="online"
        )

        # Assert
        mock_crud_room_day.get_by_room_id_and_date.assert_called_once()
        mock_crud_room_day.create.assert_called_once()
        assert result["ticket_number"] == "001"
        assert result["status"] == "checked_in"
        mock_db_session.commit.assert_called_once()

    @patch('app.services.checkin_service.get_patient')
    @patch('app.services.checkin_service.crud_appointment')
    @patch('app.services.checkin_service.crud_room_day')
    @patch('app.services.checkin_service.crud_checkin')
    def test_checkin_concurrency_control(self, mock_crud_checkin, mock_crud_room_day, mock_crud_appointment, mock_get_patient, mock_db_session, mock_patient, mock_appointment):
        # Arrange
        test_patient_id = uuid.uuid4()
        test_appointment_id = uuid.uuid4()
        test_doctor_id = uuid.uuid4()

        # Create concrete Patient and Appointment objects for mocks
        patient_obj = Patient(
            patient_id=test_patient_id,
            card_number="12345",
            name="Test Patient",
            password_hash="hashed",
            dob=date(2000, 1, 1),
            phone="1234567890",
            email="test@example.com",
            is_verified=True,
            suspended_until=None
        )
        appointment_obj = Appointment(
            appointment_id=test_appointment_id,
            patient_id=test_patient_id,
            doctor_id=test_doctor_id,
            date=date.today(),
            time_period="morning",
            status="scheduled"
        )
        initial_room_day_obj = RoomDay(
            room_day_id=uuid.uuid4(),
            room_id=test_doctor_id,
            date=date.today(),
            next_sequence=5, # Starting at 5
            current_called_sequence=None
        )

        mock_get_patient.return_value = patient_obj
        mock_crud_appointment.get.return_value = appointment_obj
        
        # Mock update_status to actually change the status of the appointment_obj
        def mock_update_status(db, appointment_id, new_status):
            appointment_obj.status = new_status
            return appointment_obj
        mock_crud_appointment.update_status.side_effect = mock_update_status
        
        mock_crud_room_day.get_by_room_id_and_date.return_value = initial_room_day_obj
        mock_crud_room_day.get_room_day_for_update.return_value = initial_room_day_obj # Return the same object for locking

        def mock_increment_next_sequence(db, db_obj):
            db_obj.next_sequence += 1
            return db_obj
        mock_crud_room_day.update_next_sequence.side_effect = mock_increment_next_sequence

        mock_crud_checkin.create.return_value = MagicMock(ticket_number="005") # Expecting 005

        service = CheckinService()

        # Act
        result = service.create_checkin(
            db=mock_db_session,
            patient_id=test_patient_id,
            appointment_id=test_appointment_id,
            checkin_method="online"
        )

        # Assert
        assert result["ticket_number"] == "005"
        assert initial_room_day_obj.next_sequence == 6 # Verify that next_sequence was incremented
        mock_db_session.commit.assert_called_once()