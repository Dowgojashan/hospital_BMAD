from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.utils.user import create_random_doctor
from tests.utils.auth import get_admin_token
from app.schemas.schedule import ScheduleCreate
from datetime import date, time


def test_create_schedule(client: TestClient, db: Session) -> None:
    token = get_admin_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}
    doctor = create_random_doctor(db)
    data = {"doctor_id": str(doctor.doctor_id), "date": "2025-11-20", "start": "09:00:00", "end": "12:00:00", "time_period": "morning"}
    response = client.post("/api/v1/schedules/", headers=headers, json=data)
    assert response.status_code == 201
    content = response.json()
    assert content["doctor_id"] == str(doctor.doctor_id)
    assert content["date"] == "2025-11-20"
    assert content["time_period"] == "morning"


def test_list_schedules(client: TestClient, db: Session) -> None:
    token = get_admin_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}
    doctor = create_random_doctor(db)
    schedule_in = ScheduleCreate(doctor_id=doctor.doctor_id, date=date(2025, 11, 21), start=time(9,0), end=time(12,0), time_period="morning")
    # Create a schedule to ensure there is data to list
    schedule_in_dict = schedule_in.model_dump()
    schedule_in_dict['doctor_id'] = str(schedule_in_dict['doctor_id'])
    schedule_in_dict['date'] = schedule_in_dict['date'].isoformat()
    client.post("/api/v1/schedules/", headers=headers, json=schedule_in_dict)
    response = client.get("/api/v1/schedules/", headers=headers)
    assert response.status_code == 200
    content = response.json()
    assert isinstance(content, list)
    assert len(content) > 0
