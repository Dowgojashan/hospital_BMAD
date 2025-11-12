## Story: Doctor Views Their Appointments

**Epic:** Epic C - 線上掛號與預約 (Online Appointment Booking)
**Goal:** Allow a logged-in doctor to view a list of appointments booked with them.

**Reusability:**
*   Leverage existing `Doctor` model and authentication.
*   Utilize the newly created `APPOINTMENT` model and CRUD operations.
*   Create a new frontend page for doctors to view their appointments.

**Acceptance Criteria:**
*   A logged-in doctor can navigate to their "我的預約" (My Appointments) page (or similar).
*   The page displays a list of the doctor's appointments, including past and upcoming ones.
*   Each appointment entry shows relevant details such as patient's name, date, time period, and status.
*   The page should handle cases where the doctor has no appointments.

---

### Implementation Details

#### 1. Backend: API Endpoint for Listing Doctor's Appointments

**File:** `backend/app/api/routers/doctor_appointments.py`
**Action:** Create new file.

```python
# backend/app/api/routers/doctor_appointments.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from typing import List

from app.db.session import get_db
from app.schemas.appointment import AppointmentPublic
from app.api.deps import get_current_active_doctor
from app.crud.crud_appointment import appointment as crud_appointment
from app.crud.crud_patient import patient as crud_patient
from app.crud.crud_doctor import doctor as crud_doctor # Needed for enriching doctor details if necessary

router = APIRouter()

@router.get("/appointments", response_model=List[AppointmentPublic])
def list_doctor_appointments(
    db: Session = Depends(get_db),
    current_doctor: dict = Depends(get_current_active_doctor)
):
    """
    Retrieve a list of appointments for the current doctor.
    """
    doctor_id = current_doctor.doctor_id # Assuming current_doctor is the Doctor object
    appointments = crud_appointment.get_multi_by_doctor(db, doctor_id=doctor_id)

    # Enrich appointments with patient and doctor names/specialty
    enriched_appointments = []
    for appt in appointments:
        db_patient = crud_patient.get(db, patient_id=appt.patient_id)
        db_doctor = crud_doctor.get(db, doctor_id=appt.doctor_id) # Get doctor details for specialty

        if db_patient and db_doctor:
            enriched_appointments.append(AppointmentPublic(
                **appt.dict(),
                patient_name=db_patient.name,
                doctor_name=db_doctor.name,
                specialty=db_doctor.specialty
            ))
        else:
            # Handle cases where patient or doctor might be missing
            enriched_appointments.append(AppointmentPublic(
                **appt.dict(),
                patient_name="未知病患",
                doctor_name="未知醫師",
                specialty="未知科別"
            ))
    return enriched_appointments
```

**File:** `backend/app/main.py`
**Action:** Modify existing file to import and include `doctor_appointments` router.

```python
# backend/app/main.py
# ... (existing imports)
from app.api.routers import auth, admin_management, schedules, profile, doctor_schedules, patient_schedules, patient_appointments, doctor_appointments # Add doctor_appointments

app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(admin_management.router, prefix="/api/v1", tags=["admin-management"])
app.include_router(schedules.router, prefix="/api/v1/schedules", tags=["schedules"])
app.include_router(profile.router, prefix="/api/v1/profile", tags=["profile-management"])
app.include_router(doctor_schedules.router, prefix="/api/v1/doctors", tags=["doctor-schedules"])
app.include_router(patient_schedules.router, prefix="/api/v1/patient", tags=["patient-schedules"])
app.include_router(patient_appointments.router, prefix="/api/v1/patient", tags=["patient-appointments"])
app.include_router(doctor_appointments.router, prefix="/api/v1/doctor", tags=["doctor-appointments"]) # Add this line
```

#### 2. Frontend: Create DoctorAppointmentsPage.jsx

**File:** `frontend/src/pages/DoctorAppointmentsPage.jsx`
**Action:** Create new file.

```javascript
// frontend/src/pages/DoctorAppointmentsPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './DoctorAppointmentsPage.css'; // Assuming a CSS file for styling

const TIME_PERIOD_MAP = {
  morning: '上午診',
  afternoon: '下午診',
  night: '夜間診',
};

const DoctorAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await api.get('/api/v1/doctor/appointments');
        setAppointments(response.data);
      } catch (err) {
        console.error('Failed to fetch doctor appointments:', err);
        setError('載入醫師預約失敗，請稍後再試。');
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
        <p className="page-subtitle">查看您的病患預約</p>
      </div>

      {appointments.length === 0 ? (
        <div className="alert alert-info">您目前沒有任何病患預約。</div>
      ) : (
        <div className="appointments-list">
          {appointments.map((appointment) => (
            <div key={appointment.appointment_id} className="appointment-card">
              <div className="appointment-header">
                <h3>病患: {appointment.patient_name}</h3>
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

export default DoctorAppointmentsPage;
```

**File:** `frontend/src/pages/DoctorAppointmentsPage.css`
**Action:** Create new file for styling.

```css
/* frontend/src/pages/DoctorAppointmentsPage.css */
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

**File:** `frontend/src/App.jsx`
**Action:** Modify existing file to add route for `DoctorAppointmentsPage`.

```javascript
// frontend/src/App.jsx
// ... (existing imports)
import DoctorAppointmentsPage from './pages/DoctorAppointmentsPage'; // Add this import

function AppContent() {
  // ... (existing code)
  return (
    <>
      <Navbar /> {/* Render Navbar component */}
      <Routes>
        {/* ... (existing routes) */}
        <Route path="/doctor/appointments" element={<ProtectedRoute><DoctorAppointmentsPage /></ProtectedRoute>} /> {/* Add this route */}
        {/* ... (rest of the routes) */}
      </Routes>
    </>
  )
}
// ... (rest of the file)
```

**File:** `frontend/src/components/Navbar.jsx`
**Action:** Modify existing file to add navigation link for `DoctorAppointmentsPage`.

```javascript
// frontend/src/components/Navbar.jsx
// ... (existing imports)

const Navbar = () => {
  // ... (existing code)
  return (
    <nav className="navbar">
      <div className="navbar-content">
        {/* ... (existing navbar-brand) */}
        <ul className="navbar-nav">
          {user ? (
            <>
              {user.role === 'patient' && (
                <>
                  <li className="nav-item">
                    <Link to="/appointments" className={`nav-link ${isActive('/appointments')}`}>
                      我的預約
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/book" className={`nav-link ${isActive('/book')}`}>
                      線上掛號
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/checkin" className={`nav-link ${isActive('/checkin')}`}>
                      報到
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/records" className={`nav-link ${isActive('/records')}`}>
                      我的病歷
                    </Link>
                  </li>
                </>
              )}
              {user.role === 'doctor' && (
                <>
                  <li className="nav-item">
                    <Link to="/doctor/schedules" className={`nav-link ${isActive('/doctor/schedules')}`}>
                      我的班表
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/doctor/appointments" className={`nav-link ${isActive('/doctor/appointments')}`}>
                      我的預約
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/doctor/leave" className={`nav-link ${isActive('/doctor/leave')}`}>
                      停診申請
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/doctor/records" className={`nav-link ${isActive('/doctor/records')}`}>
                      病歷管理
                    </Link>
                  </li>
                </>
              )}
              {/* ... (admin and other links) */}
            </>
          ) : (
            <li className="nav-item">
              <Link to="/login" className={`nav-link ${isActive('/login')}`}>
                登入
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
```
