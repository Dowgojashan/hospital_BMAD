# User Story D1: Patient Online/Kiosk Check-in

**Epic:** Epic D - 到診報到與候診排隊（Check-in & Queue Management）
**User Story:** D1
**Title:** As a patient, I want to be able to check in online or at a kiosk to avoid waiting in line at the registration desk.

## 1. Description
This story covers the backend implementation for a patient to check in for their appointment. The system must handle two methods: 'online' and 'onsite' (kiosk). The core logic involves updating the appointment status, generating a unique ticket number for the day, and recording the check-in event. This process must also respect any penalties that restrict a patient from checking in online.

## 2. Acceptance Criteria
- **AC-1 (Successful Online Check-in):** When a patient with a valid, non-suspended account performs an online check-in for an active appointment, the system must:
    - Update the `APPOINTMENT` status to `checked_in`.
    - Atomically generate a new `ticket_sequence` for the corresponding clinic/doctor for that day using the `RoomDay` table.
    - Create a new record in the `CHECKIN` table with `checkin_method` as 'online', the generated `ticket_sequence`, and the current `checkin_time`.
    - Return a success response including the `ticket_number`.
- **AC-2 (Successful Onsite/Kiosk Check-in):** When a check-in is performed via a kiosk, the system follows the same logic as AC-1, but the `checkin_method` is recorded as 'onsite'.
- **AC-3 (Restricted Online Check-in):** If a patient with a `suspended_until` date in the future attempts to check in online, the system must reject the request with a `403 Forbidden` error and a clear message indicating that they are restricted to onsite check-in only.
- **AC-4 (Invalid Appointment Status):** The system must reject check-in attempts for appointments that are not in a `scheduled` or `confirmed` state (e.g., already `cancelled`, `completed`, or `no_show`).
- **AC-5 (Same-day Booking Restriction):** The system must prevent check-in for appointments booked on the same day, returning a `400 Bad Request` error.
- **AC-6 (Concurrency Control):** The process of allocating a `ticket_sequence` from the `RoomDay` table must be atomic and transaction-safe to prevent race conditions and duplicate numbers. This should be implemented using a `SELECT ... FOR UPDATE` database lock.
- **AC-7 (Auditability):** All successful and failed check-in attempts must be logged for auditing purposes, including the patient ID, appointment ID, timestamp, and outcome.

## 3. Technical Design & Implementation Notes
- **Endpoint:** Create a new FastAPI endpoint, e.g., `POST /api/v1/appointments/{appointment_id}/check-in`.
- **Request Body:** The request should contain the `checkin_method` ('online' or 'onsite').
- **Service Layer:** All business logic should reside in a `CheckinService`.
    - The main service method, `create_checkin`, will orchestrate the validation and database operations.
    - It will first fetch the `Patient` and `Appointment` records.
    - It will validate the patient's suspension status and the appointment's status.
- **Repository Layer:**
    - A `RoomDayRepository` will be responsible for fetching and atomically incrementing the `next_sequence` for a given `room_id` (doctor/clinic) and `date`.
    - A `CheckinRepository` will be responsible for creating the `CHECKIN` record.
    - The `AppointmentRepository` will be used to update the appointment's status.
- **Database Models:**
    - **`APPOINTMENT`:** The `status` field will be updated.
    - **`PATIENT`:** The `suspended_until` field will be read for validation.
    - **`CHECKIN`:** A new model and table are required as defined in the SDD. It should contain `checkin_id`, `appointment_id`, `patient_id`, `checkin_time`, `checkin_method`, `ticket_sequence`, and `ticket_number`.
    - **`RoomDay`:** A new model and table are required for managing daily ticket sequences per clinic/doctor. It should contain `room_id`, `date`, and `next_sequence`.
- **Transaction Management:** The entire check-in process (validating, updating appointment, incrementing sequence, creating check-in record) must be wrapped in a single database transaction to ensure data integrity.

## 4. Dependencies
- **Epic A:** Relies on the `Patient` model and authentication context to identify the user and check their `suspended_until` status.
- **Epic C:** Relies on the `Appointment` model created during the booking process.

## 5. Test Cases
- **Unit Tests:**
    - Test `CheckinService` logic with mocked repositories.
    - Test validation rules: suspended patient, invalid appointment status, same-day booking.
- **Integration Tests:**
    - Test the `POST /check-in` endpoint against a test database.
    - Verify that concurrent requests for the same clinic result in unique, sequential `ticket_sequence` numbers.
    - Verify that a transaction rollback occurs if any step in the process fails.
- **E2E Tests:**
    - A test simulating a patient booking an appointment on a previous day, then successfully checking in online today.
    - A test simulating a suspended patient attempting to check in online and receiving a 403 error.
