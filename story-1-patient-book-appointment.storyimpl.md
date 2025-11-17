## Story: Enable Patient to Book an Appointment from Available Schedule Slot

**Epic:** Epic C - 線上掛號與預約 (Online Appointment Booking)
**Goal:** Allow a patient to select an available schedule slot on the `BookAppointmentPage.jsx` and submit a booking request, resulting in a new appointment record in the system. This story focuses on the happy path of booking a confirmed appointment.

**Reusability:**
*   Leverage existing `Patient` and `Doctor` models.
*   Utilize existing authentication for the patient.
*   Integrate with the already implemented patient schedule viewing on `BookAppointmentPage.jsx`.
*   Use the `APPOINTMENT` table structure defined in PRD/SDD.

**Acceptance Criteria:**
*   Patient can select an available schedule slot (date, doctor, time period) from the calendar on the "線上掛號" page.
*   Upon selecting a slot and confirming, a new appointment record is created in the database with `status` as 'scheduled' or 'confirmed'.
*   The system prevents double-booking of the same schedule slot using a concurrency control mechanism (e.g., `SELECT ... FOR UPDATE`).
*   The patient receives a confirmation message upon successful booking.
*   The booking functionality is integrated into the existing `BookAppointmentPage.jsx`.

---

### Implementation Details

#### 1. Backend: Database Model for Appointment

**File:** `backend/app/models/appointment.py`
**Action:** Create new file.

```python
# backend/app/models/appointment.py
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, ForeignKey, DateTime, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class Appointment(Base):
    __tablename__ = "appointment"

    appointment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patient.patient_id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctor.doctor_id"), nullable=False)
    date = Column(Date, nullable=False)
    time_period = Column(String, nullable=False) # e.g., "morning", "afternoon", "night"
    status = Column(String, nullable=False, default="scheduled") # e.g., "scheduled", "confirmed", "cancelled", "no_show"
    created_at = Column(DateTime(timezone=True), default=datetime.now, nullable=False)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
```

**File:** `backend/app/models/patient.py`
**Action:** Modify existing file to add `appointments` relationship.

```python
# backend/app/models/patient.py
# ... (existing imports)
from sqlalchemy.orm import relationship # Ensure this is imported

class Patient(Base):
    # ... (existing columns)
    appointments = relationship("Appointment", back_populates="patient")
```

**File:** `backend/app/models/doctor.py`
**Action:** Modify existing file to add `appointments` relationship.

```python
# backend/app/models/doctor.py
# ... (existing imports)
from sqlalchemy.orm import relationship # Ensure this is imported

class Doctor(Base):
    # ... (existing columns)
    appointments = relationship("Appointment", back_populates="doctor")
```

#### 2. Backend: Pydantic Schemas for Appointment

**File:** `backend/app/schemas/appointment.py`
**Action:** Create new file.

```python
# backend/app/schemas/appointment.py
import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

# Shared properties
class AppointmentBase(BaseModel):
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    date: date
    time_period: str = Field(..., pattern="^(morning|afternoon|night)$")
    status: str = Field("scheduled", pattern="^(scheduled|confirmed|waitlist|cancelled|checked_in|waiting|called|in_consult|completed|no_show)$")

# Properties to receive via API on creation
class AppointmentCreate(BaseModel):
    doctor_id: uuid.UUID
    date: date
    time_period: str = Field(..., pattern="^(morning|afternoon|night)$")

# Properties to receive via API on update
class AppointmentUpdate(BaseModel):
    date: Optional[date] = None
    time_period: Optional[str] = Field(None, pattern="^(morning|afternoon|night)$")
    status: Optional[str] = Field(None, pattern="^(scheduled|confirmed|waitlist|cancelled|checked_in|waiting|called|in_consult|completed|no_show)$")

# Properties to return via API
class AppointmentInDB(AppointmentBase):
    model_config = ConfigDict(from_attributes=True)

    appointment_id: uuid.UUID
    created_at: datetime

# Additional properties to return via API (e.g., for patient/doctor view)
class AppointmentPublic(AppointmentInDB):
    doctor_name: str
    specialty: str
    patient_name: str
```

#### 3. Backend: CRUD Operations for Appointment

**File:** `backend/app/crud/crud_appointment.py`
**Action:** Create new file.

```python
# backend/app/crud/crud_appointment.py
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import date

from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate

class CRUDAppointment:
    def create(self, db: Session, *, obj_in: AppointmentCreate, patient_id: uuid.UUID) -> Appointment:
        db_obj = Appointment(
            patient_id=patient_id,
            doctor_id=obj_in.doctor_id,
            date=obj_in.date,
            time_period=obj_in.time_period,
            status="scheduled" # Default status
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get(self, db: Session, appointment_id: uuid.UUID) -> Optional[Appointment]:
        return db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()

    def get_multi_by_patient(self, db: Session, patient_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Appointment]:
        return db.query(Appointment).filter(Appointment.patient_id == patient_id).offset(skip).limit(limit).all()

    def get_multi_by_doctor(self, db: Session, doctor_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Appointment]:
        return db.query(Appointment).filter(Appointment.doctor_id == doctor_id).offset(skip).limit(limit).all()

    def update(self, db: Session, *, db_obj: Appointment, obj_in: AppointmentUpdate) -> Appointment:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, appointment_id: uuid.UUID) -> Optional[Appointment]:
        obj = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
        if obj:
            db.delete(obj)
            db.commit()
        return obj

appointment = CRUDAppointment()
```

#### 4. Backend: Service Layer for Appointment Booking Logic

**File:** `backend/app/services/appointment_service.py`
**Action:** Create new file.

```python
# backend/app/services/appointment_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import uuid
from datetime import date

from app.crud.crud_appointment import appointment as crud_appointment
from app.crud.crud_schedule import schedule as crud_schedule
from app.schemas.appointment import AppointmentCreate, AppointmentInDB
from app.models.schedule import Schedule
from app.models.appointment import Appointment

class AppointmentService:
    def create_appointment(
        self, db: Session, *, patient_id: uuid.UUID, appointment_in: AppointmentCreate
    ) -> AppointmentInDB:
        # Start a transaction
        with db.begin():
            # 1. Check if the schedule exists and is available
            # Use SELECT ... FOR UPDATE to lock the schedule row to prevent race conditions
            # when multiple patients try to book the same slot.
            schedule_query = db.query(Schedule).filter(
                Schedule.doctor_id == appointment_in.doctor_id,
                Schedule.date == appointment_in.date,
                Schedule.time_period == appointment_in.time_period,
                Schedule.status == "active" # Ensure schedule is active
            ).with_for_update() # Apply row-level lock

            schedule = schedule_query.first()

            if not schedule:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Schedule not found or not active."
                )

            # 2. Check for existing appointments for this schedule slot
            # This assumes a schedule slot can only have one appointment.
            # If multiple appointments per slot are allowed, this logic needs adjustment
            # (e.g., checking remaining capacity).
            existing_appointment = db.query(Appointment).filter(
                Appointment.doctor_id == appointment_in.doctor_id,
                Appointment.date == appointment_in.date,
                Appointment.time_period == appointment_in.time_period,
                Appointment.status.in_(["scheduled", "confirmed"]) # Consider only active appointments
            ).first()

            if existing_appointment:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This time slot is already booked."
                )

            # 3. Create the appointment
            new_appointment = crud_appointment.create(db, obj_in=appointment_in, patient_id=patient_id)

            # No need to update schedule status here unless we want to mark it as "full"
            # The existence of an appointment for the slot implies it's taken.

            return new_appointment

appointment_service = AppointmentService()
```

#### 5. Backend: API Endpoint for Appointment Booking

**File:** `backend/app/api/routers/patient_appointments.py`
**Action:** Create new file.

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
        # For AppointmentPublic, we need doctor_name, specialty, patient_name
        # This would typically be handled by a more comprehensive service method or a view.
        # For now, we'll just return the basic appointment and assume frontend can fetch details.
        # Or, we can enrich it here if needed. Let's enrich it for better UX.
        from app.crud.crud_doctor import doctor as crud_doctor
        from app.crud.crud_patient import patient as crud_patient

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
```

**File:** `backend/app/api/deps.py`
**Action:** Modify existing file to add `get_current_patient`.

```python
# backend/app/api/deps.py
# ... (existing imports)
from app.core.security import verify_token
from app.crud.crud_patient import patient as crud_patient
from app.crud.crud_doctor import doctor as crud_doctor
from app.crud.crud_admin import admin as crud_admin
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.admin import Admin

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = verify_token(token)
        user_id: str = payload.get("sub")
        user_role: str = payload.get("role")
        if user_id is None or user_role is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = None
    if user_role == "patient":
        user = crud_patient.get(db, patient_id=user_id)
    elif user_role == "doctor":
        user = crud_doctor.get(db, doctor_id=user_id)
    elif user_role == "admin":
        user = crud_admin.get(db, admin_id=user_id)

    if user is None:
        raise credentials_exception
    return {"user_id": user_id, "role": user_role, "user_obj": user}

async def get_current_active_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return current_user["user_obj"]

async def get_current_active_doctor(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return current_user["user_obj"]

async def get_current_patient(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "patient":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return {"patient_id": current_user["user_id"], "patient_obj": current_user["user_obj"]}
```

**File:** `backend/app/api/deps.py`
**Action:** Modify existing file to add imports for `crud_patient` and `Patient` model.

```python
# backend/app/api/deps.py
# ... (existing imports)
from app.crud.crud_patient import patient as crud_patient # Add this import
from app.models.patient import Patient # Add this import
# ... (rest of the file)
```

#### 6. Backend: Register New Router

**File:** `backend/app/main.py`
**Action:** Modify existing file to import and include `patient_appointments` router.

```python
# backend/app/main.py
# ... (existing imports)
from app.api.routers import auth, admin_management, schedules, profile, doctor_schedules, patient_schedules, patient_appointments # Add patient_appointments

app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(admin_management.router, prefix="/api/v1", tags=["admin-management"])
app.include_router(schedules.router, prefix="/api/v1/schedules", tags=["schedules"])
app.include_router(profile.router, prefix="/api/v1/profile", tags=["profile-management"])
app.include_router(doctor_schedules.router, prefix="/api/v1/doctors", tags=["doctor-schedules"])
app.include_router(patient_schedules.router, prefix="/api/v1/patient", tags=["patient-schedules"])
app.include_router(patient_appointments.router, prefix="/api/v1/patient", tags=["patient-appointments"]) # Add this line
```

#### 7. Frontend: Integrate Booking Functionality

**File:** `frontend/src/pages/BookAppointmentPage.jsx`
**Action:** Modify existing file to enable booking.

```javascript
// frontend/src/pages/BookAppointmentPage.jsx
// ... (existing imports and TIME_PERIOD_OPTIONS)

const BookAppointmentPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedScheduleSlot, setSelectedScheduleSlot] = useState(null); // New state to hold selected slot for booking

  // ... (existing useEffects and loadDoctors, loadSchedules functions)

  const handleBookAppointment = async () => {
    if (!selectedScheduleSlot) {
      setMessage('請選擇一個班表時段進行預約。');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const appointmentData = {
        doctor_id: selectedScheduleSlot.doctor_id,
        date: selectedScheduleSlot.date,
        time_period: selectedScheduleSlot.time_period,
      };
      await api.post('/api/v1/patient/appointments', appointmentData);
      setMessage('預約成功！');
      setSelectedScheduleSlot(null); // Clear selection after successful booking
      loadSchedules(); // Reload schedules to reflect the booking
    } catch (error) {
      console.error('預約失敗:', error);
      setMessage(error.response?.data?.detail || '預約失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">線上掛號</h1>
        <p className="page-subtitle">選擇科別、醫師和時段進行預約</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('成功') ? 'alert-success' : 'alert-danger'}`}>
          {message}
        </div>
      )}

      <div className="card">
        <h3>查詢班表</h3>
        <div className="filter-controls">
          {/* ... (existing specialty and doctor filters) */}

          <div className="form-group">
            <label className="form-label">時段</label>
            <select
              className="form-select"
              value={selectedTimePeriod}
              onChange={(e) => setSelectedTimePeriod(e.target.value)}
            >
              <option value="">所有時段</option>
              {TIME_PERIOD_OPTIONS.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>班表日曆</h3>
        {loading ? (
          <div className="loading">載入中...</div>
        ) : (
          <Calendar
            onChange={setCalendarDate}
            value={calendarDate}
            onActiveStartDateChange={({ activeStartDate }) => setCalendarDate(activeStartDate)}
            minDate={new Date()}
            locale="zh-TW"
            className="react-calendar-custom"
            tileContent={({ date, view }) => {
              if (view === 'month') {
                const daySchedules = schedules.filter(
                  (schedule) =>
                    new Date(schedule.date).toDateString() === date.toDateString()
                );

                if (daySchedules.length === 0) return null;

                return (
                  <div className="schedule-tile-content">
                    {daySchedules.map((schedule) => (
                      <div
                        key={schedule.schedule_id}
                        className={`schedule-entry ${selectedScheduleSlot?.schedule_id === schedule.schedule_id ? 'selected' : ''}`}
                        onClick={() => setSelectedScheduleSlot(schedule)} // Select slot on click
                      >
                        <span className="doctor-name">{schedule.doctor_name}</span>
                        <span className="specialty">({schedule.specialty})</span>
                        <span className="time-period">
                          ({TIME_PERIOD_OPTIONS.find(option => option.value === schedule.time_period)?.label})
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
        )}
      </div>

      {/* Booking form - now enabled */}
      <div className="card">
        <h3>確認預約</h3>
        {selectedScheduleSlot ? (
          <div className="booking-confirmation">
            <p>您已選擇：</p>
            <p>醫師: <strong>{selectedScheduleSlot.doctor_name}</strong> ({selectedScheduleSlot.specialty})</p>
            <p>日期: <strong>{new Date(selectedScheduleSlot.date).toLocaleDateString('zh-TW')}</strong></p>
            <p>時段: <strong>{TIME_PERIOD_OPTIONS.find(option => option.value === selectedScheduleSlot.time_period)?.label}</strong></p>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={handleBookAppointment}
              disabled={loading}
            >
              {loading ? '預約中...' : '確認預約'}
            </button>
          </div>
        ) : (
          <p>請從日曆中選擇一個可用的班表時段。</p>
        )}
      </div>
    </div>
  );
};

export default BookAppointmentPage;
```

**File:** `frontend/src/pages/BookAppointmentPage.css`
**Action:** Modify existing file to add styling for selected schedule slot.

```css
/* frontend/src/pages/BookAppointmentPage.css */
/* ... (existing styles) */

.schedule-entry.selected {
  background-color: #e0f7fa; /* Light blue background for selected slot */
  border: 1px solid #00bcd4; /* Cyan border */
  box-shadow: 0 0 5px rgba(0, 188, 212, 0.5);
}

.booking-confirmation {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.booking-confirmation p {
  margin-bottom: 8px;
  font-size: 1rem;
}

.booking-confirmation p strong {
  color: #007bff;
}
```
