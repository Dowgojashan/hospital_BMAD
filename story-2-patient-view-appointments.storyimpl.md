## Story: Patient Views Their Booked Appointments

**Epic:** Epic C - 線上掛號與預約 (Online Appointment Booking)
**Goal:** Allow a logged-in patient to view a list of their own upcoming and past appointments.

**Reusability:**
*   Leverage existing `Patient` model and authentication.
*   Utilize the newly created `APPOINTMENT` model and CRUD operations.
*   Update the existing `AppointmentsPage.jsx` to fetch and display real data.

**Acceptance Criteria:**
*   A logged-in patient can navigate to their "我的預約" (My Appointments) page.
*   The page displays a list of the patient's appointments, including past and upcoming ones.
*   Each appointment entry shows relevant details such as doctor's name, specialty, date, time period, and status.
*   The page should handle cases where the patient has no appointments.

---

### Implementation Details

#### 1. Backend: API Endpoint for Listing Patient's Appointments

**File:** `backend/app/api/routers/patient_appointments.py`
**Action:** Modify existing file to add a GET endpoint for listing patient's appointments.

```python
# backend/app/api/routers/patient_appointments.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from typing import List

from app.db.session import get_db
from app.schemas.appointment import AppointmentCreate, AppointmentPublic
from app.services.appointment_service import appointment_service
from app.api.deps import get_current_patient # Assuming get_current_patient exists
from app.crud.crud_appointment import appointment as crud_appointment
from app.crud.crud_doctor import doctor as crud_doctor
from app.crud.crud_patient import patient as crud_patient
from app.models.appointment import Appointment

router = APIRouter()

@router.post("/appointments", response_model=AppointmentPublic, status_code=status.HTTP_201_CREATED)
def create_patient_appointment(
    appointment_in: AppointmentCreate,
    db: Session = Depends(get_db),
    current_patient: dict = Depends(get_current_patient) # Patient must be logged in
):
    """
    Create a new appointment for the current patient.
    """
    patient_id = current_patient["patient_id"] # Assuming patient_id is in the token payload

    try:
        appointment = appointment_service.create_appointment(db, patient_id=patient_id, appointment_in=appointment_in)
        
        db_doctor = crud_doctor.get(db, doctor_id=appointment.doctor_id)
        db_patient = crud_patient.get(db, patient_id=appointment.patient_id)

        if not db_doctor or not db_patient:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not retrieve doctor or patient details for appointment."
            )

        return AppointmentPublic(
            **appointment.dict(),
            doctor_name=db_doctor.name,
            specialty=db_doctor.specialty,
            patient_name=db_patient.name
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create appointment: {e}"
        )

@router.get("/appointments", response_model=List[AppointmentPublic])
def list_patient_appointments(
    db: Session = Depends(get_db),
    current_patient: dict = Depends(get_current_patient)
):
    """
    Retrieve a list of appointments for the current patient.
    """
    patient_id = current_patient["patient_id"]
    appointments = crud_appointment.get_multi_by_patient(db, patient_id=patient_id)

    # Enrich appointments with doctor and patient names/specialty
    enriched_appointments = []
    for appt in appointments:
        db_doctor = crud_doctor.get(db, doctor_id=appt.doctor_id)
        db_patient = crud_patient.get(db, patient_id=appt.patient_id)
        
        if db_doctor and db_patient:
            enriched_appointments.append(AppointmentPublic(
                **appt.dict(),
                doctor_name=db_doctor.name,
                specialty=db_doctor.specialty,
                patient_name=db_patient.name
            ))
        else:
            # Handle cases where doctor or patient might be missing (e.g., data inconsistency)
            enriched_appointments.append(AppointmentPublic(
                **appt.dict(),
                doctor_name="未知醫師",
                specialty="未知科別",
                patient_name="未知病患"
            ))
    return enriched_appointments
```

#### 2. Frontend: Update AppointmentsPage.jsx

**File:** `frontend/src/pages/AppointmentsPage.jsx`
**Action:** Modify existing file to fetch and display patient's appointments.

```javascript
// frontend/src/pages/AppointmentsPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './AppointmentsPage.css'; // Assuming a CSS file for styling

const TIME_PERIOD_MAP = {
  morning: '上午診',
  afternoon: '下午診',
  night: '夜間診',
};

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await api.get('/api/v1/patient/appointments');
        setAppointments(response.data);
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
        setError('載入預約失敗，請稍後再試。');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  if (loading) {
    return <div className="container">載入中...</div>;
  }

  if (error) {
    return <div className="container alert alert-danger">{error}</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">我的預約</h1>
        <p className="page-subtitle">查看您的歷史與未來預約</p>
      </div>

      {appointments.length === 0 ? (
        <div className="alert alert-info">您目前沒有任何預約。</div>
      ) : (
        <div className="appointments-list">
          {appointments.map((appointment) => (
            <div key={appointment.appointment_id} className="appointment-card">
              <div className="appointment-header">
                <h3>{appointment.doctor_name} ({appointment.specialty})</h3>
                <span className={`appointment-status status-${appointment.status}`}>
                  {appointment.status === 'scheduled' && '已預約'}
                  {appointment.status === 'confirmed' && '已確認'}
                  {appointment.status === 'cancelled' && '已取消'}
                  {appointment.status === 'completed' && '已完成'}
                  {/* Add more status mappings as needed */}
                </span>
              </div>
              <div className="appointment-details">
                <p>日期: {new Date(appointment.date).toLocaleDateString('zh-TW')}</p>
                <p>時段: {TIME_PERIOD_MAP[appointment.time_period] || appointment.time_period}</p>
                <p>預約編號: {appointment.appointment_id.substring(0, 8)}...</p>
                <p>建立時間: {new Date(appointment.created_at).toLocaleString('zh-TW')}</p>
              </div>
              {/* Add action buttons here later, e.g., modify/cancel */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
```

**File:** `frontend/src/pages/AppointmentsPage.css`
**Action:** Create new file for styling.

```css
/* frontend/src/pages/AppointmentsPage.css */
.appointments-list {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.appointment-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.appointment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.appointment-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.appointment-status {
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 0.85rem;
  font-weight: bold;
  color: #fff;
}

.status-scheduled { background-color: #007bff; } /* Blue */
.status-confirmed { background-color: #28a745; } /* Green */
.status-cancelled { background-color: #dc3545; } /* Red */
.status-completed { background-color: #6c757d; } /* Gray */
/* Add more status styles as needed */

.appointment-details p {
  margin: 5px 0;
  font-size: 0.95rem;
  color: #555;
}

.appointment-details p strong {
  color: #333;
}
```
