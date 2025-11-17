# Epic D Implementation Plan: Check-in & Queue Management

This document contains the detailed user stories and technical implementation plans for all features within Epic D.

---

## User Story D1: Patient Online/Kiosk Check-in

**Epic:** Epic D - 到診報到與候診排隊（Check-in & Queue Management）
**User Story:** D1
**Title:** As a patient, I want to be able to check in online or at a kiosk to avoid waiting in line at the registration desk.

### 1. Description
This story covers the backend implementation for a patient to check in for their appointment. The system must handle two methods: 'online' and 'onsite' (kiosk). The core logic involves updating the appointment status, generating a unique ticket number for the day, and recording the check-in event. This process must also respect any penalties that restrict a patient from checking in online.

### 2. Acceptance Criteria
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

### 3. Technical Design & Implementation Notes
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

---

## User Story D2: Real-time Queue Reminders

**Epic:** Epic D - 到診報到與候診排隊（Check-in & Queue Management）
**User Story:** D2
**Title:** As a patient, I want to receive a reminder when my turn is approaching so I can be ready for my consultation.

### 1. Description
This story involves creating a backend mechanism to monitor the clinic's queue and send a real-time notification to a patient when their appointment is imminent. The trigger for this notification is when the patient's ticket number is two positions away from the currently called number.

### 2. Acceptance Criteria
- **AC-1 (Notification Trigger):** When the clinic staff calls a number (e.g., number 5), the system must identify the patient holding the number two positions ahead (i.e., number 7).
- **AC-2 (Send Notification):** The system must trigger a notification to be sent to the patient identified in AC-1. The notification channel can be WebSocket for real-time UI updates, and/or an asynchronous task for sending an SMS or push notification.
- **AC-3 (Notification Content):** The notification message should be clear, e.g., "Your turn is approaching. Please prepare to proceed to the consultation room."
- **AC-4 (Logging):** The system must log the successful dispatch of the notification, including the patient ID, appointment ID, and timestamp. Failed dispatches should also be logged with an error.
- **AC-5 (No-Op for Close Numbers):** If the patient's number is already 1 or 0 positions away (or has passed), no notification should be sent.

### 3. Technical Design & Implementation Notes
- **Endpoint for Calling Number:** A new endpoint is required for clinic staff to signal that a number has been called, e.g., `POST /api/v1/clinics/{room_id}/call-next`. This endpoint will receive the `ticket_number` being called.
- **Service Layer (`QueueService`):**
    - A new `QueueService` will handle the logic.
    - The `call_next` method will receive the `room_id` and the `called_ticket_sequence`.
    - It will update the `current_called_sequence` in the `RoomDay` table for that room.
    - It will then calculate the target number for notification (i.e., `called_ticket_sequence + 2`).
    - It will query the `CHECKIN` table to find the appointment/patient associated with the target number for that day and room.
- **Notification Integration:**
    - Upon finding the target patient, the `QueueService` will use the existing `NotificationService` (or a similar utility) to dispatch the reminder.
    - For real-time UI, this service can publish an event to a message queue (like RabbitMQ or Redis Pub/Sub) which a WebSocket handler is subscribed to. The WebSocket handler then pushes the message to the specific client.
    - For SMS/Push, it can enqueue a background task (e.g., Celery).
- **Database Models:**
    - **`RoomDay`:** The `current_called_sequence` field will be updated and read frequently.
    - **`CHECKIN`:** Will be queried to find the patient associated with a specific `ticket_sequence`.

---

## User Story D3: Handling Missed Turns (No-Show)

**Epic:** Epic D - 到診報到與候診排隊（Check-in & Queue Management）
**User Story:** D3
**Title:** As an administrator, I want the system to automatically handle patients who miss their turn to maintain queue order.

### 1. Description
This story defines the process for when a patient fails to show up after being called. The system should automatically mark the appointment as a 'no_show' and trigger the penalty-tracking mechanism (covered in D4). This story also covers the "re-queue" process for a patient who was marked as a no-show but later arrives at the clinic.

### 2. Acceptance Criteria
- **AC-1 (No-Show Detection):** A "no-show" is defined as a patient who does not present themselves within 3 minutes of their `ticket_number` being called. A background job or a check at the end of the clinic session should identify these appointments.
- **AC-2 (Automatic Status Update):** When a no-show is detected, the system must update the corresponding `APPOINTMENT` status to `no_show`.
- **AC-3 (Trigger Infraction):** The status update to `no_show` must trigger the creation of a new record in the `INFRACTION` table with `infraction_type` set to 'no_show' (this links to Story D4).
- **AC-4 (Re-Queueing Logic):** If a patient marked as `no_show` checks in again at an onsite kiosk (as per UC-QM-02), the system must place them back in the queue. The rule is to insert them three positions after the `current_called_sequence`.
- **AC-5 (Logging):** All `no_show` status changes and re-queueing events must be recorded in the `AUDIT_LOG`.

### 3. Technical Design & Implementation Notes
- **No-Show Detection Mechanism:**
    - **Option A (Scheduled Job):** A periodic background job (e.g., running every 5 minutes) queries for appointments that were `called` more than 3 minutes ago but are not yet `in_consult` or `completed`.
    - **Option B (End-of-Session):** A process that runs when a clinic session is closed. It sweeps through all appointments for that session and marks any unfulfilled ones as `no_show`.
    - For MVP, Option A is more real-time. This requires a `called_at` timestamp, which can be stored in the `VisitCall` table as defined in the SDD.
- **Service Layer (`QueueService` / `AppointmentService`):**
    - A method like `handle_no_shows` will contain the detection logic.
    - When a no-show is confirmed, this service will call the `AppointmentRepository` to update the status and then call an `InfractionService` to create the infraction record.
- **Re-Queueing:**
    - The logic for this will be in the `CheckinService` from Story D1.
    - When a patient with an appointment status of `no_show` checks in, the service will calculate the new queue position (`current_called_sequence + 3`) and update the queue management system accordingly. This might not mean a new ticket, but rather a re-prioritization of their existing ticket.
- **Database Models:**
    - **`APPOINTMENT`:** The `status` will be updated to `no_show`.
    - **`VisitCall`:** A new model/table is needed to store call history, including `appointment_id`, `ticket_sequence`, and `called_at`. This is crucial for the 3-minute rule.
    - **`INFRACTION`:** A new model/table is needed (see Story D4).

---

## User Story D4: No-Show Penalty System

**Epic:** Epic D - 到診報到與候診排隊（Check-in & Queue Management）
**User Story:** D4
**Title:** As an administrator, I want the system to automatically penalize patients who repeatedly miss their appointments to encourage compliance.

### 1. Description
This story implements the penalty system for patients who accumulate a certain number of "no-show" infractions. When a patient reaches the threshold, they will be temporarily restricted from using the online check-in feature, forcing them to check in onsite.

### 2. Acceptance Criteria
- **AC-1 (Infraction Recording):** Every time an appointment status is set to `no_show`, a corresponding record must be created in the `INFRACTION` table, linked to the `patient_id` and `appointment_id`.
- **AC-2 (Penalty Threshold):** The penalty is triggered when a patient accumulates **3** `no_show` infractions.
- **AC-3 (Applying the Penalty):** Upon reaching the 3rd infraction, the system must automatically:
    - Update the `PATIENT` record by setting the `suspended_until` field to a date 180 days in the future.
    - Update the `INFRACTION` record to mark `penalty_applied` as `true` and record the `penalty_until` date.
- **AC-4 (Enforcing the Penalty):** The check-in logic from Story D1 must correctly read the `suspended_until` field and block online check-in attempts for penalized patients.
- **AC-5 (Admin Override):** A secure endpoint must be available for administrators to manually view, apply, or remove a patient's suspension. All manual overrides must be recorded in the `AUDIT_LOG`.

### 3. Technical Design & Implementation Notes
- **Service Layer (`InfractionService`):**
    - Create a new `InfractionService`.
    - A method `create_infraction(patient_id, appointment_id, type)` will be called by other services (like `AppointmentService`) when a no-show occurs.
    - Inside this method, after creating the `Infraction` record, it will query the `InfractionRepository` to count the total `no_show` infractions for that patient.
    - If the count reaches 3, it will call the `PatientRepository` to update the `suspended_until` date.
- **Repository Layer:**
    - **`InfractionRepository`:** Manages CRUD operations for the `INFRACTION` table. Will need a method to count infractions by `patient_id` and `infraction_type`.
    - **`PatientRepository`:** Will have a method to update the `suspended_until` field for a given `patient_id`.
- **Database Models:**
    - **`INFRACTION`:** A new model and table are required as defined in the SDD. It must include `infraction_id`, `patient_id`, `appointment_id`, `infraction_type`, `occurred_at`, `penalty_applied`, and `penalty_until`.
    - **`PATIENT`:** The `suspended_until` field is used to enforce the penalty.
- **Transaction Management:** The process of creating an infraction, counting the total, and applying the penalty should be atomic to prevent race conditions where a penalty might be missed or doubly applied.
- **Admin Endpoint:** Create a new set of endpoints under an admin-only router, e.g., `POST /api/v1/admin/patients/{patient_id}/suspend` and `POST /api/v1/admin/patients/{patient_id}/unsuspend`. These should be protected by role-based access control (RBAC).
