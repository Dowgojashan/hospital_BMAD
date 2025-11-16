---
story_id: story-e4-frontend-medical-record-form
title: 前端 - 建立「醫師」用的病歷撰寫/編輯表單介面
epic: Epic E - 病歷管理
labels: [frontend, UI, MedicalRecord, React]
status: todo
---

### 描述

作為前端開發者，我需要為醫師角色建立一個直觀的病歷撰寫和編輯表單介面。此介面將允許醫師輸入病患的診療摘要，並將資料提交到後端 API。介面應支援創建新病歷和編輯現有病歷的功能。

### 驗收標準

- 存在一個新的 React 元件，例如 `MedicalRecordForm.jsx`。
- 介面包含以下輸入欄位：
    - 病患選擇器 (Patient Selector)：允許醫師選擇或搜尋病患。
    - 預約選擇器 (Appointment Selector)：允許醫師選擇本次看診的預約 (可選)。
    - 診療摘要 (Summary)：一個多行文字輸入框，用於輸入病歷內容。
- 介面應能根據傳入的 `record_id` (如果存在) 預填現有病歷資料。
- 介面應能處理表單提交：
    - 創建新病歷時，呼叫 `POST /api/v1/records`。
    - 編輯現有病歷時，呼叫 `PUT /api/v1/records/{record_id}`。
- 介面應顯示提交狀態（例如載入中、成功、失敗）和錯誤訊息。
- 介面應有基本的表單驗證（例如診療摘要不可為空）。
- 介面應符合現有的前端設計風格和響應式佈局。

### 任務與子任務

1.  **建立 `MedicalRecordForm` React 元件:**
    *   在 `frontend/src/components/MedicalRecordForm.jsx` 中創建新檔案。
    *   使用 React 的 `useState` 和 `useEffect` 管理表單狀態和資料載入。
    *   導入 `api` (axios 實例) 進行後端 API 呼叫。
    *   導入 `useAuthStore` 獲取當前登入醫師的資訊。

2.  **設計表單 UI:**
    *   包含一個用於輸入診療摘要的 `textarea`。
    *   實現一個病患選擇器，可能需要一個搜尋功能來選擇病患。
    *   實現一個預約選擇器，列出所選病患的相關預約，並允許醫師選擇。
    *   包含提交按鈕。

3.  **實作資料載入與預填:**
    *   如果元件接收到 `record_id` prop，則在 `useEffect` 中呼叫 `GET /api/v1/records/{record_id}` (此 API 需在後續故事中實作) 來載入病歷資料並預填表單。

4.  **實作表單提交邏輯:**
    *   創建 `handleSubmit` 函數，根據是否有 `record_id` 決定呼叫 `POST` 或 `PUT` API。
    *   處理 API 響應，顯示成功或失敗訊息。
    *   處理表單驗證，例如確保 `summary` 不為空。

5.  **整合到 Doctor Clinic Management Page (暫定):**
    *   在 `frontend/src/pages/DoctorClinicManagementPage.jsx` 中，為每個病患的列表項添加一個「撰寫病歷」或「編輯病歷」按鈕。
    *   點擊按鈕時，彈出 `MedicalRecordForm` 或導航到一個新的病歷頁面。

### 檔案變更

- `frontend/src/components/MedicalRecordForm.jsx`: 新增 MedicalRecordForm 元件。
- `frontend/src/pages/DoctorClinicManagementPage.jsx`: 修改，添加觸發 MedicalRecordForm 的按鈕和邏輯。
- `frontend/src/components/MedicalRecordForm.css`: (可選) 新增樣式檔案。

### 測試計畫

- **單元測試 (使用 Vitest 和 React Testing Library):**
    - 測試 `MedicalRecordForm` 元件是否正確渲染。
    - 測試輸入欄位是否可交互，並能更新組件狀態。
    - 測試提交按鈕是否觸發表單提交函數。
    - 測試在有 `record_id` 時，表單是否能正確預填資料。
    - 測試表單驗證邏輯。
- **整合測試 (使用 MSW 模擬 API):**
    - 模擬 `POST /api/v1/records` 成功和失敗的響應，測試表單提交行為。
    - 模擬 `PUT /api/v1/records/{record_id}` 成功和失敗的響應，測試表單編輯行為。
    - 測試在 `DoctorClinicManagementPage` 中點擊按鈕後，`MedicalRecordForm` 是否正確顯示。
- **E2E 測試 (使用 Playwright):**
    - 模擬醫生登入。
    - 導航到診間管理頁面。
    - 點擊「撰寫病歷」按鈕，填寫表單並提交，驗證病歷是否成功創建。
    - 點擊「編輯病歷」按鈕，修改表單並提交，驗證病歷是否成功更新。

### 參考資料

- PRD: `prd_1.md` (Epic E - 病歷資料管理, 功能 5.2 醫生新增病歷, 5.3 醫生修改病歷)
- SDD: `software-design-document.md` (前端技術堆疊, 開發與實作標準)
- 現有前端元件範例: `frontend/src/pages/DoctorClinicManagementPage.jsx`
- 現有 API 呼叫範例: `frontend/src/api/axios.js`
