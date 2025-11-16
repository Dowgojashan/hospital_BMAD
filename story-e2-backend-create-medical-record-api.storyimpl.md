---
story_id: story-e2-backend-create-medical-record-api
title: 後端 - 建立 POST /api/v1/records (建立病歷) API 端點
epic: Epic E - 病歷管理
labels: [backend, API, MedicalRecord, FastAPI]
status: completed
---

### 描述

作為後端開發者，我需要建立一個 API 端點，允許已授權的醫生為病患創建新的病歷記錄。此端點將接收病歷資料，並使用先前實作的 `CRUDMedicalRecord` 操作將其儲存到資料庫。

### 驗收標準

- 存在 `app/api/routers/medical_record.py` 檔案，定義 FastAPI 路由。
- 路由中包含 `POST /api/v1/records` 端點。
- 端點接收 `MedicalRecordCreate` Pydantic schema 作為請求體。
- 端點要求醫生角色進行身份驗證和授權 (`get_current_active_doctor` 或類似機制)。
- 端點成功創建病歷後，返回 `MedicalRecordPublic` Pydantic schema 和 HTTP 狀態碼 201 Created。
- 端點在創建病歷時，將 `doctor_id` 自動設定為當前登入醫生的 ID。
- 端點在創建病歷時，將 `patient_id` 和 `appointment_id` 從請求體中獲取。
- 錯誤情況下，端點返回適當的 HTTP 錯誤狀態碼和錯誤訊息（例如 400 Bad Request, 403 Forbidden, 404 Not Found）。
- 成功創建病歷的事件應被記錄到審計日誌（如果審計服務已實作）。

### 任務與子任務

1.  [x] **建立 Medical Record FastAPI 路由:**
    *   [x] 在 `app/api/routers/medical_record.py` 中定義一個新的 `APIRouter`。
    *   [x] 導入必要的依賴項，包括 `Session`、`Depends`、`HTTPException`、`status`、`get_db`、`get_current_active_doctor`、`crud_medical_record` 和 `MedicalRecordCreate`、`MedicalRecordPublic`。

2.  [x] **實作 `POST /api/v1/records` 端點:**
    *   [x] 定義一個異步函數，使用 `@router.post("/records", response_model=MedicalRecordPublic, status_code=status.HTTP_201_CREATED)` 裝飾器。
    *   [x] 將 `MedicalRecordCreate` 作為請求體參數，並注入 `db: Session = Depends(get_db)` 和 `current_doctor: Doctor = Depends(get_current_active_doctor)`。
    *   [x] 在函數內部，驗證 `patient_id` 和 `appointment_id` 是否存在（如果 `appointment_id` 存在）。
    *   [x] 使用 `crud_medical_record.create` 方法創建新的病歷記錄。
    *   [x] 確保 `doctor_id` 來自 `current_doctor.doctor_id`。
    *   [x] 返回創建的病歷記錄。
    *   [x] 處理可能的錯誤，例如 `patient_id` 或 `appointment_id` 不存在。

3.  [x] **整合到主 FastAPI 應用:**
    *   [x] 在 `app/main.py` 中導入新的 `medical_record` 路由並使用 `app.include_router()` 註冊。

### 檔案變更

- `backend/app/api/routers/medical_record.py`: 新增 Medical Record 路由和 `POST` 端點。
- `backend/app/main.py`: 註冊 `medical_record` 路由。

### 測試計畫

- **單元測試:**
    - 測試 `POST /api/v1/records` 端點，使用 `TestClient` 模擬請求。
    - 模擬 `get_current_active_doctor` 依賴項，確保只有醫生可以創建病歷。
    - 模擬 `crud_medical_record.create` 方法，驗證其被正確調用。
    - 測試無效輸入（例如缺少必填欄位）時的錯誤處理。
    - 測試 `patient_id` 不存在時的錯誤處理。
- **整合測試:**
    - 啟動一個測試資料庫，創建測試醫生和病患。
    - 發送實際的 `POST` 請求到 `/api/v1/records`，驗證病歷是否成功創建並儲存到資料庫。
    - 驗證返回的響應體和狀態碼是否正確。
    - 驗證未經授權的請求是否被拒絕。

### 參考資料

- PRD: `prd_1.md` (Epic E - 病歷資料管理, 功能 5.2 醫生新增病歷)
- SDD: `software-design-document.md` (API 與 Schema 規範, 系統架構與原始碼樹)
- 現有 API 路由範例: `app/api/routers/doctor_clinic_management.py`
- 現有認證依賴項: `app/api/dependencies.py`
- Pydantic Schema 範例: `app/schemas/schedule.py`

### Dev Agent Record

#### Completion Notes
- Implemented the `POST /api/v1/records` endpoint in `backend/app/api/routers/medical_record.py`.
- Added necessary imports for `crud_patient` and `crud_appointment` for validation.
- Ensured `doctor_id` is automatically set from the current authenticated doctor.
- Integrated the `medical_record` router into `backend/app/main.py`.

#### Change Log
- `backend/app/api/routers/medical_record.py`: Created new file with `APIRouter` and `POST /records` endpoint.
- `backend/app/main.py`: Modified to import `medical_record` router.
