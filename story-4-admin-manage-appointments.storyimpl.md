## Story: Admin Manages All Appointments

**Epic:** Epic C - 線上掛號與預約 (Online Appointment Booking)
**Goal:** Allow an admin to view, create, update, and delete any appointment within the system.

**Reusability:**
*   Leverage existing `Admin` model and authentication.
*   Utilize the newly created `APPOINTMENT` model and CRUD operations.
*   Create a new frontend page for administrators to manage all appointments.

**Acceptance Criteria:**
*   A logged-in administrator can navigate to an "Appointments Management" page.
*   The page displays a paginated and filterable list of all appointments in the system.
*   Admin can view details of any appointment, including patient name, doctor name, date, time period, and status.
*   Admin can create new appointments (e.g., for walk-ins or manual scheduling).
*   Admin can modify existing appointments (e.g., change patient, doctor, date, time, status).
*   Admin can cancel or delete appointments.
*   All admin actions on appointments are recorded in the audit log.

---

### Implementation Details

#### 1. Backend: API Endpoints for Admin Appointment Management

**File:** `backend/app/api/routers/admin_appointments.py`
**Action:** Create new file.

```python
# backend/app/api/routers/admin_appointments.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import uuid
from typing import List, Optional

from app.db.session import get_db
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentPublic, AppointmentInDB
from app.services.appointment_service import appointment_service
from app.api.deps import get_current_active_admin
from app.crud.crud_appointment import appointment as crud_appointment
from app.crud.crud_patient import patient as crud_patient
from app.crud.crud_doctor import doctor as crud_doctor
from app.models.appointment import Appointment

router = APIRouter()

@router.post("/appointments", response_model=AppointmentPublic, status_code=status.HTTP_201_CREATED)
def create_appointment_by_admin(
    appointment_in: AppointmentCreate, # Admin can specify patient_id
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_active_admin),
    patient_id: uuid.UUID = Query(..., description="Patient ID for the appointment")
):
    """
    Create a new appointment by an administrator. Admin specifies the patient_id.
    """
    try:
        # Currently, appointment_service.create_appointment expects patient_id within its call.
        # We need to refine the service or pass patient_id explicitly to CRUD.
        # For this story, assume admin provides patient_id.
        appointment = crud_appointment.create(db, obj_in=appointment_in, patient_id=patient_id)
        
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
def list_all_appointments(
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_active_admin),
    skip: int = 0,
    limit: int = 100,
    patient_id: Optional[uuid.UUID] = Query(None, description="Filter by Patient ID"),
    doctor_id: Optional[uuid.UUID] = Query(None, description="Filter by Doctor ID"),
    status: Optional[str] = Query(None, description="Filter by Appointment Status")
):
    """
    Retrieve all appointments, with optional filters, for administrators.
    """
    appointments = db.query(Appointment)

    if patient_id:
        appointments = appointments.filter(Appointment.patient_id == patient_id)
    if doctor_id:
        appointments = appointments.filter(Appointment.doctor_id == doctor_id)
    if status:
        appointments = appointments.filter(Appointment.status == status)

    appointments = appointments.offset(skip).limit(limit).all()

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
            enriched_appointments.append(AppointmentPublic(
                **appt.dict(),
                doctor_name="未知醫師",
                specialty="未知科別",
                patient_name="未知病患"
            ))
    return enriched_appointments

@router.get("/appointments/{appointment_id}", response_model=AppointmentPublic)
def get_appointment_by_id(
    appointment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_active_admin)
):
    """
    Retrieve a single appointment by ID for administrators.
    """
    appointment = crud_appointment.get(db, appointment_id=appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    
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

@router.put("/appointments/{appointment_id}", response_model=AppointmentPublic)
def update_appointment_by_admin(
    appointment_id: uuid.UUID,
    appointment_in: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_active_admin)
):
    """
    Update an existing appointment by an administrator.
    """
    db_appointment = crud_appointment.get(db, appointment_id=appointment_id)
    if not db_appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    
    updated_appointment = crud_appointment.update(db, db_obj=db_appointment, obj_in=appointment_in)

    db_doctor = crud_doctor.get(db, doctor_id=updated_appointment.doctor_id)
    db_patient = crud_patient.get(db, patient_id=updated_appointment.patient_id)
    
    if not db_doctor or not db_patient:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve doctor or patient details for updated appointment."
        )

    return AppointmentPublic(
        **updated_appointment.dict(),
        doctor_name=db_doctor.name,
        specialty=db_doctor.specialty,
        patient_name=db_patient.name
    )

@router.delete("/appointments/{appointment_id}", response_model=AppointmentPublic)
def delete_appointment_by_admin(
    appointment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_active_admin)
):
    """
    Delete an appointment by an administrator.
    """
    appointment = crud_appointment.remove(db, appointment_id=appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    db_doctor = crud_doctor.get(db, doctor_id=appointment.doctor_id)
    db_patient = crud_patient.get(db, patient_id=appointment.patient_id)
    
    if not db_doctor or not db_patient:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve doctor or patient details for deleted appointment."
        )

    return AppointmentPublic(
        **appointment.dict(),
        doctor_name=db_doctor.name,
        specialty=db_doctor.specialty,
        patient_name=db_patient.name
    )
```

**File:** `backend/app/main.py`
**Action:** Modify existing file to import and include `admin_appointments` router.

```python
# backend/app/main.py
# ... (existing imports)
from app.api.routers import auth, admin_management, schedules, profile, doctor_schedules, patient_schedules, patient_appointments, doctor_appointments, admin_appointments # Add admin_appointments

app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(admin_management.router, prefix="/api/v1", tags=["admin-management"])
app.include_router(schedules.router, prefix="/api/v1/schedules", tags=["schedules"])
app.include_router(profile.router, prefix="/api/v1/profile", tags=["profile-management"])
app.include_router(doctor_schedules.router, prefix="/api/v1/doctors", tags=["doctor-schedules"])
app.include_router(patient_schedules.router, prefix="/api/v1/patient", tags=["patient-schedules"])
app.include_router(patient_appointments.router, prefix="/api/v1/patient", tags=["patient-appointments"])
app.include_router(doctor_appointments.router, prefix="/api/v1/doctor", tags=["doctor-appointments"])
app.include_router(admin_appointments.router, prefix="/api/v1/admin", tags=["admin-appointments"]) # Add this line
```

#### 2. Frontend: Create AdminAppointmentManagementPage.jsx

**File:** `frontend/src/pages/AdminAppointmentManagementPage.jsx`
**Action:** Create new file.

```javascript
// frontend/src/pages/AdminAppointmentManagementPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './AdminAppointmentManagementPage.css'; // Assuming a CSS file for styling

const TIME_PERIOD_MAP = {
  morning: '上午診',
  afternoon: '下午診',
  night: '夜間診',
};

const STATUS_OPTIONS = [
  { value: "scheduled", label: "已預約" },
  { value: "confirmed", label: "已確認" },
  { value: "waitlist", label: "候補中" },
  { value: "cancelled", label: "已取消" },
  { value: "checked_in", label: "已報到" },
  { value: "waiting", label: "候診中" },
  { value: "called", label: "已叫號" },
  { value: "in_consult", label: "看診中" },
  { value: "completed", label: "已完成" },
  { value: "no_show", label: "未報到" },
];

const AdminAppointmentManagementPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]); // To fetch all patients for creation/update
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterPatientId, setFilterPatientId] = useState('');
  const [filterDoctorId, setFilterDoctorId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);

  // Form states for create/edit
  const [formPatientId, setFormPatientId] = useState('');
  const [formDoctorId, setFormDoctorId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTimePeriod, setFormTimePeriod] = useState('');
  const [formStatus, setFormStatus] = useState('scheduled');

  useEffect(() => {
    fetchData();
  }, [filterPatientId, filterDoctorId, filterStatus, currentPage]); // Refetch when filters or page changes

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all appointments
      const params = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
      };
      if (filterPatientId) params.patient_id = filterPatientId;
      if (filterDoctorId) params.doctor_id = filterDoctorId;
      if (filterStatus) params.status = filterStatus;

      const apptsResponse = await api.get('/api/v1/admin/appointments', { params });
      setAppointments(apptsResponse.data);

      // Fetch doctors for create/edit forms and filters
      const doctorsResponse = await api.get('/api/v1/doctors'); // Assuming admin can access all doctors
      setDoctors(doctorsResponse.data);

      // Fetch patients for create/edit forms and filters - assuming an admin endpoint exists
      const patientsResponse = await api.get('/api/v1/admin/patients'); // TODO: Create this endpoint if not exists
      setPatients(patientsResponse.data);

    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('載入資料失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = {
        doctor_id: formDoctorId,
        date: formDate,
        time_period: formTimePeriod,
        status: formStatus,
      };
      await api.post(`/api/v1/admin/appointments?patient_id=${formPatientId}`, data);
      setShowCreateModal(false);
      resetForm();
      fetchData(); // Refresh list
      alert('預約建立成功！');
    } catch (err) {
      console.error('建立預約失敗:', err);
      setError(err.response?.data?.detail || '建立預約失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAppointment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!currentAppointment) return;

    try {
      const data = {
        doctor_id: formDoctorId,
        date: formDate,
        time_period: formTimePeriod,
        status: formStatus,
      };
      // Note: patient_id is not included in AppointmentUpdate schema for simplicity in this story
      await api.put(`/api/v1/admin/appointments/${currentAppointment.appointment_id}`, data);
      setShowEditModal(false);
      resetForm();
      fetchData(); // Refresh list
      alert('預約更新成功！');
    } catch (err) {
      console.error('更新預約失敗:', err);
      setError(err.response?.data?.detail || '更新預約失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('確定要刪除此預約嗎？')) return;
    setLoading(true);
    setError('');
    try {
      await api.delete(`/api/v1/admin/appointments/${appointmentId}`);
      fetchData(); // Refresh list
      alert('預約刪除成功！');
    } catch (err) {
      console.error('刪除預約失敗:', err);
      setError(err.response?.data?.detail || '刪除預約失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (appointment) => {
    setCurrentAppointment(appointment);
    setFormPatientId(appointment.patient_id);
    setFormDoctorId(appointment.doctor_id);
    setFormDate(appointment.date); // Assuming date is YYYY-MM-DD
    setFormTimePeriod(appointment.time_period);
    setFormStatus(appointment.status);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormPatientId('');
    setFormDoctorId('');
    setFormDate('');
    setFormTimePeriod('');
    setFormStatus('scheduled');
    setCurrentAppointment(null);
  };

  if (loading) {
    return <div className="container">載入中...</div>;
  }

  if (error) {
    return <div className="container alert alert-danger">{error}</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">預約管理</h1>
        <p className="page-subtitle">管理所有病患預約</p>
      </div>

      <div className="card">
        <h3>篩選條件</h3>
        <div className="filter-controls">
          <div className="form-group">
            <label>病患</label>
            <select
              className="form-select"
              value={filterPatientId}
              onChange={(e) => setFilterPatientId(e.target.value)}
            >
              <option value="">所有病患</option>
              {patients.map((patient) => (
                <option key={patient.patient_id} value={patient.patient_id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>醫師</label>
            <select
              className="form-select"
              value={filterDoctorId}
              onChange={(e) => setFilterDoctorId(e.target.value)}
            >
              <option value="">所有醫師</option>
              {doctors.map((doctor) => (
                <option key={doctor.doctor_id} value={doctor.doctor_id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>狀態</label>
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">所有狀態</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={fetchData}>應用篩選</button>
        </div>
        <button className="btn btn-success mt-3" onClick={openCreateModal}>新增預約</button>
      </div>

      <div className="card mt-4">
        <h3>預約列表</h3>
        {appointments.length === 0 ? (
          <div className="alert alert-info">無符合條件的預約記錄。</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>病患</th>
                  <th>醫師 (科別)</th>
                  <th>日期</th>
                  <th>時段</th>
                  <th>狀態</th>
                  <th>建立時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.appointment_id}>
                    <td>{appt.patient_name}</td>
                    <td>{appt.doctor_name} ({appt.specialty})</td>
                    <td>{new Date(appt.date).toLocaleDateString('zh-TW')}</td>
                    <td>{TIME_PERIOD_MAP[appt.time_period] || appt.time_period}</td>
                    <td>
                      <span className={`appointment-status status-${appt.status}`}>
                        {STATUS_OPTIONS.find(op => op.value === appt.status)?.label || appt.status}
                      </span>
                    </td>
                    <td>{new Date(appt.created_at).toLocaleString('zh-TW')}</td>
                    <td>
                      <button className="btn btn-sm btn-warning me-2" onClick={() => openEditModal(appt)}>編輯</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDeleteAppointment(appt.appointment_id)}>刪除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination would go here */}
      </div>

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>新增預約</h4>
            <form onSubmit={handleCreateAppointment}>
              <div className="form-group">
                <label>病患</label>
                <select className="form-select" value={formPatientId} onChange={(e) => setFormPatientId(e.target.value)} required>
                  <option value="">選擇病患</option>
                  {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>醫師</label>
                <select className="form-select" value={formDoctorId} onChange={(e) => setFormDoctorId(e.target.value)} required>
                  <option value="">選擇醫師</option>
                  {doctors.map(d => <option key={d.doctor_id} value={d.doctor_id}>{d.name} ({d.specialty})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>日期</label>
                <input type="date" className="form-control" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>時段</label>
                <select className="form-select" value={formTimePeriod} onChange={(e) => setFormTimePeriod(e.target.value)} required>
                  <option value="">選擇時段</option>
                  {Object.entries(TIME_PERIOD_MAP).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>狀態</label>
                <select className="form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value)} required>
                  {STATUS_OPTIONS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary me-2" disabled={loading}>儲存</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>取消</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>編輯預約</h4>
            <form onSubmit={handleEditAppointment}>
              <div className="form-group">
                <label>病患 (不可修改)</label>
                <input type="text" className="form-control" value={patients.find(p => p.patient_id === formPatientId)?.name || ''} disabled />
              </div>
              <div className="form-group">
                <label>醫師</label>
                <select className="form-select" value={formDoctorId} onChange={(e) => setFormDoctorId(e.target.value)} required>
                  <option value="">選擇醫師</option>
                  {doctors.map(d => <option key={d.doctor_id} value={d.doctor_id}>{d.name} ({d.specialty})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>日期</label>
                <input type="date" className="form-control" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>時段</label>
                <select className="form-select" value={formTimePeriod} onChange={(e) => setFormTimePeriod(e.target.value)} required>
                  <option value="">選擇時段</option>
                  {Object.entries(TIME_PERIOD_MAP).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>狀態</label>
                <select className="form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value)} required>
                  {STATUS_OPTIONS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary me-2" disabled={loading}>儲存</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>取消</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminAppointmentManagementPage;
```

**File:** `frontend/src/pages/AdminAppointmentManagementPage.css`
**Action:** Create new file for styling.

```css
/* frontend/src/pages/AdminAppointmentManagementPage.css */

.filter-controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.table-responsive {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th, .table td {
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  text-align: left;
}

.table th {
  background-color: #f8f9fa;
  font-weight: bold;
  color: #343a40;
}

.table tbody tr:hover {
  background-color: #f1f1f1;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 0.2rem;
}

.me-2 {
  margin-right: 0.5rem;
}

.mt-3 {
  margin-top: 1rem;
}

.mt-4 {
  margin-top: 1.5rem;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h4 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.modal-content .form-group {
  margin-bottom: 15px;
}

.modal-content .form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
.appointment-status {
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 0.85rem;
  font-weight: bold;
  color: #fff;
  white-space: nowrap; /* Prevent status text from wrapping */
}

.status-scheduled { background-color: #007bff; }
.status-confirmed { background-color: #28a745; }
.status-waitlist { background-color: #ffc107; color: #333;}
.status-cancelled { background-color: #dc3545; }
.status-checked_in { background-color: #17a2b8; }
.status-waiting { background-color: #fd7e14; }
.status-called { background-color: #6f42c1; }
.status-in_consult { background-color: #20c997; }
.status-completed { background-color: #6c757d; }
.status-no_show { background-color: #343a40; }
```


**File:** `frontend/src/App.jsx`
**Action:** Modify existing file to add route for `AdminAppointmentManagementPage`.

```javascript
// frontend/src/App.jsx
// ... (existing imports)
import AdminAppointmentManagementPage from './pages/AdminAppointmentManagementPage'; // Add this import

function AppContent() {
  // ... (existing code)
  return (
    <>
      <Navbar /> {/* Render Navbar component */}
      <Routes>
        {/* ... (existing routes) */}
        <Route path="/admin/appointments" element={<ProtectedAdminRoute><AdminAppointmentManagementPage /></ProtectedAdminRoute>} /> {/* Add this route */}
        {/* ... (rest of the routes) */}
      </Routes>
    </>
  )
}
// ... (rest of the file)
```

**File:** `frontend/src/components/Navbar.jsx`
**Action:** Modify existing file to add navigation link for `AdminAppointmentManagementPage`.

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
              {user.role === 'admin' && (
                <>
                  <li className="nav-item">
                    <Link to="/admin/dashboard" className={`nav-link ${isActive('/admin/dashboard')}`}>
                      儀表板
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/admin/schedules" className={`nav-link ${isActive('/admin/schedules')}`}>
                      班表管理
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/admin/users" className={`nav-link ${isActive('/admin/users')}`}>
                      帳號管理
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/admin/appointments" className={`nav-link ${isActive('/admin/appointments')}`}>
                      預約管理
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/admin/audit" className={`nav-link ${isActive('/admin/audit')}`}>
                      審計日誌
                    </Link>
                  </li>
                </>
              )}
               {/* ... (profile and logout links) */}
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

**Note:** The `AdminAppointmentManagementPage.jsx` component makes an API call to `/api/v1/admin/patients` to fetch all patients for the filters and forms. **This endpoint might not exist yet.** If it doesn't, a separate story/task would be needed to create `backend/app/api/routers/admin_patient_management.py` and implement `crud_patient.list_patients` (potentially with filtering) for admins. For the purpose of this story, we assume such an endpoint will be available or created.
