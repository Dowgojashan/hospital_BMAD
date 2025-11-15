import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import uuid4
from datetime import date, timedelta

from app.main import app
from app.models.patient import Patient
from app.api.dependencies import get_current_active_admin # Corrected dependency import
from app.crud.crud_user import update_patient_suspended_until, get_patient

# Mock the admin user dependency
def override_get_current_admin_user():
    return {"username": "admin_test", "id": uuid4()} # Return a dummy admin user

app.dependency_overrides[get_current_active_admin] = override_get_current_admin_user

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_suspend_patient_success(client: TestClient, db: Session):
    patient_id = uuid4()
    unique_card_number = str(uuid4())
    unique_email = f"test_{uuid4()}@example.com"
    # Create a patient
    patient = Patient(
        patient_id=patient_id,
        card_number=unique_card_number,
        name="Test Patient",
        password_hash="hashed_password",
        dob=date(1990, 1, 1),
        phone="123-456-7890",
        email=unique_email
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    response = client.post(f"/api/v1/admin/patients/{patient_id}/suspend")

    assert response.status_code == 200
    assert "message" in response.json()
    assert f"Patient {patient_id} suspended until" in response.json()["message"]

    updated_patient = get_patient(db, patient_id=patient_id)
    db.refresh(updated_patient) # Refresh the object to get the latest state
    assert updated_patient.suspended_until is not None
    assert updated_patient.suspended_until == date.today() + timedelta(days=180)

def test_suspend_patient_not_found(client: TestClient, db: Session):
    non_existent_patient_id = uuid4()
    response = client.post(f"/api/v1/admin/patients/{non_existent_patient_id}/suspend")

    assert response.status_code == 404
    assert response.json()["detail"] == "Patient not found."

def test_unsuspend_patient_success(client: TestClient, db: Session):
    patient_id = uuid4()
    unique_card_number = str(uuid4())
    unique_email = f"test_{uuid4()}@example.com"
    # Create a patient and suspend them
    patient = Patient(
        patient_id=patient_id,
        card_number=unique_card_number,
        name="Test Patient",
        password_hash="hashed_password",
        dob=date(1990, 1, 1),
        phone="123-456-7890",
        email=unique_email,
        suspended_until=date.today() + timedelta(days=30)
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    response = client.post(f"/api/v1/admin/patients/{patient_id}/unsuspend")

    assert response.status_code == 200
    assert response.json()["message"] == f"Patient {patient_id} unsuspended."

    updated_patient = get_patient(db, patient_id=patient_id)
    db.refresh(updated_patient) # Refresh the object to get the latest state
    assert updated_patient.suspended_until is None

def test_unsuspend_patient_not_found(client: TestClient, db: Session):
    non_existent_patient_id = uuid4()
    response = client.post(f"/api/v1/admin/patients/{non_existent_patient_id}/unsuspend")

    assert response.status_code == 404
    assert response.json()["detail"] == "Patient not found."