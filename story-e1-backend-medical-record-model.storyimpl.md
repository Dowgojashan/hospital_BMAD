---
story_id: story-e1-backend-medical-record-model
title: 後端 - 建立 MedicalRecord 資料庫模型與 CRUD 操作
epic: Epic E - 病歷管理
labels: [backend, database, MedicalRecord, CRUD]
status: completed
---

### 描述

作為後端開發者，我需要建立 `MedicalRecord` 資料庫模型，包含與 `Patient`、`Doctor` 和 `Appointment` 的關聯，並實作基本的 CRUD 操作（Create, Read, Update, Delete）以供後續 API 端點使用。這將為病歷管理功能奠定資料基礎。

### 驗收標準

- 存在 `app/models/medical_record.py` 檔案，定義 `MedicalRecord` SQLAlchemy 模型。
- `MedicalRecord` 模型包含 `record_id` (PK)、`patient_id` (FK to Patient)、`doctor_id` (FK to Doctor)、`appointment_id` (FK to Appointment)、`created_at`、`summary` 等欄位。
- `patient_id`、`doctor_id` 欄位為 NOT NULL。
- `appointment_id` 欄位可為 NULL (因為可能存在無預約的緊急看診)。
- 存在 `app/schemas/medical_record.py` 檔案，定義 `MedicalRecordBase`、`MedicalRecordCreate`、`MedicalRecordUpdate` 和 `MedicalRecordPublic` Pydantic schemas。
- `MedicalRecordCreate` 包含 `patient_id`, `doctor_id`, `appointment_id` (Optional), `summary`。
- `MedicalRecordUpdate` 包含 `summary` (Optional)。
- `MedicalRecordPublic` 包含所有 `MedicalRecord` 模型欄位，並能正確序列化。
- 存在 `app/crud/crud_medical_record.py` 檔案，定義 `CRUDMedicalRecord` 類別，包含 `create`、`get`、`get_multi_by_patient`、`get_multi_by_doctor`、`update`、`delete` 等方法。
- 成功執行 Alembic migration，在資料庫中建立 `medical_record` 表。

### 任務與子任務

1.  [x] **建立 `MedicalRecord` SQLAlchemy 模型:**
    *   [x] 在 `app/models/medical_record.py` 中定義 `MedicalRecord` 類別。
    *   [x] 確保 `record_id` 為 UUID 主鍵。
    *   [x] 建立 `patient_id` (ForeignKey to `Patient.patient_id`) 和 `doctor_id` (ForeignKey to `Doctor.doctor_id`) 欄位。
    *   [x] 建立 `appointment_id` (ForeignKey to `Appointment.appointment_id`) 欄位，並設定為可選 (nullable=True)。
    *   [x] 新增 `created_at` 欄位，預設為當前時間。
    *   [x] 新增 `summary` 欄位，型別為 TEXT。
    *   [x] 定義與 `Patient`、`Doctor`、`Appointment` 的 ORM 關係。

2.  [x] **建立 `MedicalRecord` Pydantic Schemas:**
    *   [x] 在 `app/schemas/medical_record.py` 中定義 `MedicalRecordBase`。
    *   [x] 定義 `MedicalRecordCreate` 繼承自 `MedicalRecordBase`，用於創建病歷的輸入驗證。
    *   [x] 定義 `MedicalRecordUpdate` 繼承自 `MedicalRecordBase`，用於更新病歷的輸入驗證，所有欄位為 Optional。
    *   [x] 定義 `MedicalRecordPublic` 繼承自 `MedicalRecordBase`，並包含 `record_id`, `created_at`，用於 API 回應。

3.  [x] **建立 `CRUDMedicalRecord` 操作:**
    *   [x] 在 `app/crud/crud_medical_record.py` 中定義 `CRUDMedicalRecord` 類別。
    *   [x] 實作 `create(db: Session, obj_in: MedicalRecordCreate) -> MedicalRecord` 方法。
    *   [x] 實作 `get(db: Session, record_id: UUID) -> Optional[MedicalRecord]` 方法。
    *   [x] 實作 `get_multi_by_patient(db: Session, patient_id: UUID, skip: int = 0, limit: int = 100) -> List[MedicalRecord]` 方法。
    *   [x] 實作 `get_multi_by_doctor(db: Session, doctor_id: UUID, skip: int = 0, limit: int = 100) -> List[MedicalRecord]` 方法。
    *   [x] 實作 `update(db: Session, db_obj: MedicalRecord, obj_in: MedicalRecordUpdate) -> MedicalRecord` 方法。
    *   [x] 實作 `delete(db: Session, record_id: UUID) -> Optional[MedicalRecord]` 方法。

4.  [x] **生成並應用 Alembic Migration:**
    *   [x] 運行 Alembic 命令生成新的 migration 腳本。
    *   [x] 檢查 migration 腳本，確保其正確建立 `medical_record` 表及其欄位和外鍵。
    *   [x] 應用 migration 到資料庫。

### 檔案變更

- `backend/app/models/medical_record.py`: 新增 MedicalRecord 模型定義。
- `backend/app/schemas/medical_record.py`: 新增 MedicalRecord Pydantic schemas。
- `backend/app/crud/crud_medical_record.py`: 新增 CRUDMedicalRecord 類別。
- `backend/app/crud/__init__.py`: 導入 `crud_medical_record`。
- `backend/migrations/versions/7589c943a551_add_medicalrecord_model.py`: 新增 Alembic migration 腳本。

### 測試計畫

- **單元測試:**
    - 測試 `MedicalRecord` 模型是否能正確初始化。
    - 測試 `MedicalRecordCreate`、`MedicalRecordUpdate`、`MedicalRecordPublic` schemas 的序列化和反序列化。
    - 測試 `CRUDMedicalRecord` 的 `create`、`get`、`update`、`delete` 方法，使用 mock 的 DB session。
    - 測試 `get_multi_by_patient` 和 `get_multi_by_doctor` 方法是否能正確過濾和分頁。
- **整合測試:**
    - 在測試資料庫中，創建 `Patient`、`Doctor`、`Appointment` 記錄。
    - 使用 `CRUDMedicalRecord` 創建 `MedicalRecord` 記錄，並驗證其與 `Patient`、`Doctor`、`Appointment` 的關聯是否正確。
    - 驗證 `update` 和 `delete` 操作在資料庫中的行為。
    - 驗證 Alembic migration 成功建立表結構。

### 參考資料

- PRD: `prd_1.md` (Epic E - 病歷資料管理)
- SDD: `software-design-document.md` (資料庫物理設計, 類別圖)
- 系統架構文件: `system_architecture_plan.md`
- 現有模型範例: `app/models/patient.py`, `app/models/doctor.py`, `app/models/appointment.py`
- 現有 CRUD 範例: `app/crud/crud_patient.py`, `app/crud/crud_doctor.py`
- 現有 Schema 範例: `app/schemas/patient.py`, `app/schemas/doctor.py`

### Dev Agent Record

#### Completion Notes
- Implemented MedicalRecord SQLAlchemy model in `backend/app/models/medical_record.py`.
- Created Pydantic schemas for MedicalRecord in `backend/app/schemas/medical_record.py`.
- Implemented CRUD operations for MedicalRecord in `backend/app/crud/crud_medical_record.py`.
- Added import for `crud_medical_record` in `backend/app/crud/__init__.py`.
- Successfully generated and applied Alembic migration `backend/migrations/versions/7589c943a551_add_medicalrecord_model.py`.
- Addressed multiple `DatatypeMismatch` errors during migration by explicitly casting existing `character` type UUID columns to `uuid` using raw SQL `ALTER COLUMN ... USING` statements in the migration script. This was necessary for `CHECKIN.appointment_id`, `CHECKIN.patient_id`, `CHECKIN.cancelled_by`, `DOCTOR.doctor_id`, `INFRACTION.patient_id`, `INFRACTION.appointment_id`, `MEDICAL_RECORD.patient_id`, `MEDICAL_RECORD.doctor_id`, `PATIENT.patient_id`, `ROOM_DAY.schedule_id`, `SCHEDULE.schedule_id`, `SCHEDULE.doctor_id`, `VISIT_CALL.appointment_id`, `VISIT_CALL.called_by`, `appointment.appointment_id`, `appointment.patient_id`, `appointment.doctor_id`, and `appointment.schedule_id`.

#### Change Log
- `backend/app/models/medical_record.py`: Added `appointment_id` column and ORM relationships.
- `backend/app/schemas/medical_record.py`: Created new file with `MedicalRecordBase`, `MedicalRecordCreate`, `MedicalRecordUpdate`, `MedicalRecordPublic` schemas.
- `backend/app/crud/crud_medical_record.py`: Created new file with `CRUDMedicalRecord` class and its methods.
- `backend/app/crud/__init__.py`: Added import for `crud_medical_record`.
- `backend/migrations/versions/7589c943a551_add_medicalrecord_model.py`: Modified to include raw SQL for type conversions for various UUID columns.
