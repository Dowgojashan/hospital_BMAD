---
story_id: story-e3-backend-update-medical-record-api
title: 後端 - 建立 PUT /api/v1/records/{record_id} (更新病歷) API 端點
epic: Epic E - 病歷管理
labels: [backend, API, MedicalRecord, FastAPI]
status: completed
---

### 描述

作為後端開發者，我需要建立一個 API 端點，允許已授權的醫生更新現有的病歷記錄。此端點將接收病歷的 ID 和更新的資料，並使用先前實作的 `CRUDMedicalRecord` 操作更新資料庫中的記錄。

### 驗收標準

- `app/api/routers/medical_record.py` 中包含 `PUT /api/v1/records/{record_id}` 端點。
- 端點接收 `record_id` 作為路徑參數，並接收 `MedicalRecordUpdate` Pydantic schema 作為請求體。
- 端點要求醫生角色進行身份驗證和授權 (`get_current_active_doctor` 或類似機制)。
- 只有創建該病歷的醫生或具有管理權限的用戶才能更新病歷。
- 端點成功更新病歷後，返回更新後的 `MedicalRecordPublic` Pydantic schema 和 HTTP 狀態碼 200 OK。
- 如果 `record_id` 不存在，端點返回 404 Not Found。
- 如果嘗試更新非本人創建的病歷且無管理權限，端點返回 403 Forbidden。
- 成功更新病歷的事件應被記錄到審計日誌（如果審計服務已實作）。

### 任務與子任務

1.  [x] **在 Medical Record 路由中新增 `PUT` 端點:**
    *   [x] 在 `app/api/routers/medical_record.py` 中，定義一個異步函數，使用 `@router.put("/records/{record_id}", response_model=MedicalRecordPublic)` 裝飾器。
    *   [x] 將 `record_id: UUID` 作為路徑參數，`obj_in: MedicalRecordUpdate` 作為請求體參數，並注入 `db: Session = Depends(get_db)` 和 `current_doctor: Doctor = Depends(get_current_active_doctor)`。

2.  [x] **實作更新邏輯:**
    *   [x] 使用 `crud_medical_record.get(db, record_id)` 獲取現有的病歷記錄。如果不存在，拋出 404 錯誤。
    *   [x] 檢查 `current_doctor.doctor_id` 是否與病歷的 `doctor_id` 匹配。如果不匹配，拋出 403 錯誤（除非有管理員權限檢查）。
    *   [x] 使用 `crud_medical_record.update(db, db_obj=medical_record, obj_in=obj_in)` 方法更新病歷記錄。
    *   [x] 返回更新後的病歷記錄。

### 檔案變更

- `backend/app/api/routers/medical_record.py`: 修改現有檔案，新增 `PUT` 端點。

### 測試計畫

- **單元測試:**
    - 測試 `PUT /api/v1/records/{record_id}` 端點，使用 `TestClient` 模擬請求。
    - 模擬 `get_current_active_doctor` 依賴項，確保只有醫生可以更新病歷。
    - 模擬 `crud_medical_record.get` 和 `crud_medical_record.update` 方法，驗證其被正確調用。
    - 測試更新不存在的 `record_id` 時的錯誤處理（404）。
    - 測試非創建者醫生嘗試更新病歷時的錯誤處理（403）。
    - 測試無效輸入時的錯誤處理。
- **整合測試:**
    - 啟動一個測試資料庫，創建測試醫生、病患和病歷。
    - 發送實際的 `PUT` 請求到 `/api/v1/records/{record_id}`，驗證病歷是否成功更新到資料庫。
    - 驗證返回的響應體和狀態碼是否正確。
    - 驗證未經授權的請求是否被拒絕。

### 參考資料

- PRD: `prd_1.md` (Epic E - 病歷資料管理, 功能 5.3 醫生修改病歷)
- SDD: `software-design-document.md` (API 與 Schema 規範, 系統架構與原始碼樹)
- 現有 API 路由範例: `app/api/routers/doctor_clinic_management.py`
- 現有認證依賴項: `app/api/dependencies.py`
- Pydantic Schema 範例: `app/schemas/schedule.py`

### Dev Agent Record

#### Completion Notes
- Implemented the `PUT /api/v1/records/{record_id}` endpoint in `backend/app/api/routers/medical_record.py`.
- Added logic to retrieve the medical record, validate doctor authorization, and update the record using `medical_record_crud.update`.

#### Change Log
- `backend/app/api/routers/medical_record.py`: Modified to add `PUT /records/{record_id}` endpoint.
