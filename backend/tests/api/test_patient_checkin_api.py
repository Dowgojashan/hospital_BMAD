import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import date, timedelta
import uuid

from app.main import app
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.room_day import RoomDay
from app.core.security import get_password_hash
from app.api.dependencies import get_current_patient

# Override get_current_patient for testing
def override_get_current_patient():
    return {"patient_id": uuid.uuid4()} # Return a dummy patient_id

app.dependency_overrides[get_current_patient] = override_get_current_patient

client = TestClient(app)

@pytest.fixture(scope="function")
def db_session(db: Session):
    # Clear tables before each test
    db.query(RoomDay).delete()
    db.query(Appointment).delete()
    db.query(Doctor).delete()
    db.query(Patient).delete()
    db.commit()
    yield db
    db.rollback() # Add rollback here
    db.query(RoomDay).delete()
    db.query(Appointment).delete()
    db.query(Doctor).delete()
    db.query(Patient).delete()
    db.commit()

@pytest.fixture
def test_patient(db_session: Session):
    patient = Patient(
        patient_id=override_get_current_patient()["patient_id"],
        card_number="P123456789",
        name="Test Patient",
        password_hash=get_password_hash("testpass"),
        dob=date(1990, 1, 1),
        phone="0912345678",
        email="patient@example.com",
        is_verified=True
    )
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)
    return patient

@pytest.fixture
def test_suspended_patient(db_session: Session):
    patient = Patient(
        patient_id=uuid.uuid4(),
        card_number="P987654321",
        name="Suspended Patient",
        password_hash=get_password_hash("testpass"),
        dob=date(1990, 1, 1),
        phone="0987654321",
        email="suspended@example.com",
        is_verified=True,
        suspended_until=date.today() + timedelta(days=30)
    )
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)
    return patient

@pytest.fixture
def test_doctor(db_session: Session):
    doctor = Doctor(
        doctor_id=uuid.uuid4(),
        doctor_login_id="D001",
        password_hash=get_password_hash("docpass"),
        name="Dr. Test",
        specialty="General"
    )
    db_session.add(doctor)
    db_session.commit()
    db_session.refresh(doctor)
    return doctor

@pytest.fixture
def test_appointment(db_session: Session, test_patient: Patient, test_doctor: Doctor):
    appointment = Appointment(
        appointment_id=uuid.uuid4(),
        patient_id=test_patient.patient_id,
        doctor_id=test_doctor.doctor_id,
        date=date.today(),
        time_period="morning",
        status="scheduled"
    )
    db_session.add(appointment)
    db_session.commit()
    db_session.refresh(appointment)
    return appointment

@pytest.fixture
def test_future_appointment(db_session: Session, test_patient: Patient, test_doctor: Doctor):
    appointment = Appointment(
        appointment_id=uuid.uuid4(),
        patient_id=test_patient.patient_id,
        doctor_id=test_doctor.doctor_id,
        date=date.today() + timedelta(days=1),
        time_period="morning",
        status="scheduled"
    )
    db_session.add(appointment)
    db_session.commit()
    db_session.refresh(appointment)
    return appointment

@pytest.fixture
def test_room_day(db_session: Session, test_doctor: Doctor):
    room_day = RoomDay(
        room_id=test_doctor.doctor_id,
        date=date.today(),
        next_sequence=1
    )
    db_session.add(room_day)
    db_session.commit()
    db_session.refresh(room_day)
    return room_day

class TestPatientCheckinAPI:
    def test_successful_online_checkin(self, db_session: Session, test_patient: Patient, test_appointment: Appointment, test_doctor: Doctor):
        # Override get_current_patient to return the test_patient's ID
        app.dependency_overrides[get_current_patient] = lambda: {"patient_id": test_patient.patient_id}

        response = client.post(
            f"/api/v1/patient/appointments/{test_appointment.appointment_id}/check-in",
            json={"checkin_method": "online"}
        )

        assert response.status_code == 200
        assert response.json()["message"] == "報到成功"
        assert "ticket_number" in response.json()
        assert response.json()["status"] == "checked_in"

        # Verify DB state
        updated_appointment = db_session.query(Appointment).filter(Appointment.appointment_id == test_appointment.appointment_id).first()
        assert updated_appointment.status == "checked_in"
        
        room_day = db_session.query(RoomDay).filter(RoomDay.room_id == test_doctor.doctor_id, RoomDay.date == date.today()).first()
        assert room_day.next_sequence == 2 # Should have incremented

    def test_successful_onsite_checkin(self, db_session: Session, test_patient: Patient, test_appointment: Appointment, test_doctor: Doctor):
        app.dependency_overrides[get_current_patient] = lambda: {"patient_id": test_patient.patient_id}

        response = client.post(
            f"/api/v1/patient/appointments/{test_appointment.appointment_id}/check-in",
            json={"checkin_method": "onsite"}
        )

        assert response.status_code == 200
        assert response.json()["message"] == "報到成功"
        assert "ticket_number" in response.json()
        assert response.json()["status"] == "checked_in"

        updated_appointment = db_session.query(Appointment).filter(Appointment.appointment_id == test_appointment.appointment_id).first()
        assert updated_appointment.status == "checked_in"
        
        room_day = db_session.query(RoomDay).filter(RoomDay.room_id == test_doctor.doctor_id, RoomDay.date == date.today()).first()
        assert room_day.next_sequence == 2

    def test_checkin_appointment_not_found(self, db_session: Session, test_patient: Patient):
        app.dependency_overrides[get_current_patient] = lambda: {"patient_id": test_patient.patient_id}

        response = client.post(
            f"/api/v1/patient/appointments/{uuid.uuid4()}/check-in", # Non-existent appointment ID
            json={"checkin_method": "online"}
        )
        assert response.status_code == 404
        assert "Appointment not found" in response.json()["detail"]

    def test_checkin_appointment_does_not_belong_to_patient(self, db_session: Session, test_patient: Patient, test_appointment: Appointment):
        # Override get_current_patient to return a different patient's ID
        app.dependency_overrides[get_current_patient] = lambda: {"patient_id": uuid.uuid4()}

        response = client.post(
            f"/api/v1/patient/appointments/{test_appointment.appointment_id}/check-in",
            json={"checkin_method": "online"}
        )
        assert response.status_code == 403
        assert "Appointment does not belong to patient" in response.json()["detail"]

    def test_checkin_suspended_patient_online_forbidden(self, db_session: Session, test_suspended_patient: Patient, test_doctor: Doctor):
        # Create an appointment for the suspended patient
        appointment = Appointment(
            appointment_id=uuid.uuid4(),
            patient_id=test_suspended_patient.patient_id,
            doctor_id=test_doctor.doctor_id,
            date=date.today(),
            time_period="morning",
            status="scheduled"
        )
        db_session.add(appointment)
        db_session.commit()
        db_session.refresh(appointment)

        app.dependency_overrides[get_current_patient] = lambda: {"patient_id": test_suspended_patient.patient_id}

        response = client.post(
            f"/api/v1/patient/appointments/{appointment.appointment_id}/check-in",
            json={"checkin_method": "online"}
        )
        assert response.status_code == 403
        assert "已被限制線上報到" in response.json()["detail"]

    def test_checkin_suspended_patient_onsite_allowed(self, db_session: Session, test_suspended_patient: Patient, test_doctor: Doctor):
        # Create an appointment for the suspended patient
        appointment = Appointment(
            appointment_id=uuid.uuid4(),
            patient_id=test_suspended_patient.patient_id,
            doctor_id=test_doctor.doctor_id,
            date=date.today(),
            time_period="morning",
            status="scheduled"
        )
        db_session.add(appointment)
        db_session.commit()
        db_session.refresh(appointment)

        app.dependency_overrides[get_current_patient] = lambda: {"patient_id": test_suspended_patient.patient_id}

        response = client.post(
            f"/api/v1/patient/appointments/{appointment.appointment_id}/check-in",
            json={"checkin_method": "onsite"}
        )
        assert response.status_code == 200
        assert response.json()["message"] == "報到成功"
        assert "ticket_number" in response.json()

    def test_checkin_invalid_appointment_status(self, db_session: Session, test_patient: Patient, test_doctor: Doctor):
        # Create a cancelled appointment
        appointment = Appointment(
            appointment_id=uuid.uuid4(),
            patient_id=test_patient.patient_id,
            doctor_id=test_doctor.doctor_id,
            date=date.today(),
            time_period="morning",
            status="cancelled"
        )
        db_session.add(appointment)
        db_session.commit()
        db_session.refresh(appointment)

        app.dependency_overrides[get_current_patient] = lambda: {"patient_id": test_patient.patient_id}

        response = client.post(
            f"/api/v1/patient/appointments/{appointment.appointment_id}/check-in",
            json={"checkin_method": "online"}
        )
        assert response.status_code == 400
        assert "預約狀態為 'cancelled'，無法報到。" in response.json()["detail"]

    def test_checkin_appointment_not_today(self, db_session: Session, test_patient: Patient, test_future_appointment: Appointment):
        app.dependency_overrides[get_current_patient] = lambda: {"patient_id": test_patient.patient_id}

        response = client.post(
            f"/api/v1/patient/appointments/{test_future_appointment.appointment_id}/check-in",
            json={"checkin_method": "online"}
        )
        assert response.status_code == 400
        assert "只能在預約當天報到。" in response.json()["detail"]

    def test_checkin_concurrency_ticket_sequence(self, db_session: Session, test_patient: Patient, test_doctor: Doctor):
        # Create multiple appointments for the same doctor and day
        appointments = []
        for i in range(3):
            appointment = Appointment(
                appointment_id=uuid.uuid4(),
                patient_id=test_patient.patient_id,
                doctor_id=test_doctor.doctor_id,
                date=date.today(),
                time_period="morning",
                status="scheduled"
            )
            db_session.add(appointment)
            appointments.append(appointment)
        db_session.commit()
        
        # Simulate concurrent check-ins
        results = []
        for appointment in appointments:
            app.dependency_overrides[get_current_patient] = lambda: {"patient_id": test_patient.patient_id}
            response = client.post(
                f"/api/v1/patient/appointments/{appointment.appointment_id}/check-in",
                json={"checkin_method": "online"}
            )
            results.append(response.json()["ticket_number"])
        
        # Verify unique and sequential ticket numbers
        assert len(set(results)) == 3 # All should be unique
        assert "001" in results
        assert "002" in results
        assert "003" in results