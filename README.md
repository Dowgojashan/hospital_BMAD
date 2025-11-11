# 醫院掛號系統前端

基於 React + TypeScript + Tailwind CSS 建立的現代化醫院掛號系統前端應用。

## 功能特色

### 病患功能
- 註冊與登入
- 查詢醫生班表
- 線上掛號預約
- 查看掛號記錄
- 線上報到
- 查看候診資訊
- 查看病歷記錄

### 醫生功能
- 查看個人班表
- 申請停診
- 管理病歷記錄
- 新增/修改/刪除病歷

### 管理員功能
- 帳號管理 (新增/修改/刪除)
- 班表管理
- 審計日誌查詢與匯出
- 系統儀表板

## 技術堆疊

- **框架**: React 18
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **路由**: React Router v6
- **HTTP 客戶端**: Axios
- **日期處理**: date-fns
- **圖標**: Lucide React
- **建置工具**: Vite

## 安裝與執行

### 前置需求
- Node.js 18+ 
- npm 或 yarn

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

應用將在 http://localhost:3000 啟動

### 建置生產版本

```bash
npm run build
```

### 預覽生產版本

```bash
npm run preview
```

## 專案結構

```
src/
├── components/          # 共用組件
│   ├── Layout.tsx      # 主要布局組件
│   └── ProtectedRoute.tsx # 路由保護組件
├── contexts/           # React Context
│   └── AuthContext.tsx # 認證上下文
├── pages/              # 頁面組件
│   ├── Login.tsx       # 登入頁
│   ├── Register.tsx   # 註冊頁
│   ├── patient/       # 病患頁面
│   ├── doctor/         # 醫生頁面
│   └── admin/          # 管理員頁面
├── services/           # API 服務
│   ├── api.ts          # API 客戶端
│   └── mockData.ts     # 模擬數據（開發用）
├── types/              # TypeScript 類型定義
│   └── index.ts
├── App.tsx             # 主應用組件
├── main.tsx            # 應用入口
└── index.css           # 全域樣式
```

## 後端串接指南

### 切換到真實 API

在 `src/services/api.ts` 文件中，將第 26 行的 `USE_MOCK_DATA` 設為 `false`：

```typescript
const USE_MOCK_DATA = false  // 改為 false 使用真實 API
```

### API 基礎配置

- **基礎路徑**: `/api/v1`
- **後端地址**: `http://localhost:8000` (開發環境，可在 `vite.config.ts` 中修改)
- **認證方式**: JWT Bearer Token
- **Content-Type**: `application/json`

### 認證機制

所有需要認證的 API 請求會自動在 Header 中加入：
```
Authorization: Bearer <token>
```

Token 儲存在 `localStorage` 中，key 為 `token`。

當收到 401 回應時，前端會自動清除 token 並重導向到登入頁。

### API 端點規格

#### 1. 認證相關 (Authentication)

##### POST `/api/v1/auth/login`
登入

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": {
    "id": "string (UUID)",
    "name": "string",
    "email": "string",
    "role": "patient" | "doctor" | "admin",
    "cardNumber": "string (optional, 僅病患)",
    "specialty": "string (optional, 僅醫生)"
  }
}
```

##### POST `/api/v1/auth/register`
註冊（僅病患）

**Request:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "dob": "string (YYYY-MM-DD)",
  "cardNumber": "string"
}
```

**Response:** 同 login

##### GET `/api/v1/auth/me`
取得當前使用者資訊

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "patient" | "doctor" | "admin",
  "cardNumber": "string (optional)",
  "specialty": "string (optional)",
  "suspendedUntil": "string (optional, YYYY-MM-DD)"
}
```

##### POST `/api/v1/auth/logout`
登出

**Headers:**
```
Authorization: Bearer <token>
```

#### 2. 預約相關 (Appointments)

##### GET `/api/v1/appointments`
取得所有預約（依使用者角色返回對應資料）

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "appointmentId": "string (UUID)",
    "patientId": "string (UUID)",
    "doctorId": "string (UUID)",
    "doctorName": "string",
    "specialty": "string",
    "date": "string (YYYY-MM-DD)",
    "timePeriod": "morning" | "afternoon" | "evening",
    "status": "scheduled" | "confirmed" | "waitlist" | "cancelled" | "checked_in" | "waiting" | "called" | "in_consult" | "completed" | "no_show",
    "createdAt": "string (ISO 8601)"
  }
]
```

##### POST `/api/v1/appointments`
建立預約

**Request:**
```json
{
  "doctorId": "string (UUID)",
  "date": "string (YYYY-MM-DD)",
  "timePeriod": "morning" | "afternoon" | "evening"
}
```

**Response:** 同 GET 單一預約

##### GET `/api/v1/appointments/{id}`
取得單一預約

**Response:** 單一 Appointment 物件

##### PUT `/api/v1/appointments/{id}`
更新預約

**Request:**
```json
{
  "date": "string (optional)",
  "timePeriod": "string (optional)",
  "status": "string (optional)"
}
```

##### DELETE `/api/v1/appointments/{id}`
取消預約

#### 3. 班表相關 (Schedules)

##### GET `/api/v1/schedules`
查詢班表

**Query Parameters:**
- `specialty`: string (optional) - 科別
- `doctorId`: string (optional) - 醫生 ID
- `date`: string (optional) - 日期 (YYYY-MM-DD)

**Response:**
```json
[
  {
    "scheduleId": "string (UUID)",
    "doctorId": "string (UUID)",
    "doctorName": "string",
    "specialty": "string",
    "date": "string (YYYY-MM-DD)",
    "start": "string (HH:mm)",
    "end": "string (HH:mm)",
    "status": "active" | "cancelled" | "closed",
    "availableSlots": number,
    "totalSlots": number
  }
]
```

##### POST `/api/v1/schedules`
建立班表（管理員）

**Request:**
```json
{
  "doctorId": "string (UUID)",
  "date": "string (YYYY-MM-DD)",
  "start": "string (HH:mm)",
  "end": "string (HH:mm)",
  "totalSlots": number
}
```

##### PUT `/api/v1/schedules/{id}`
更新班表

##### DELETE `/api/v1/schedules/{id}`
刪除班表

#### 4. 報到相關 (Check-in)

##### POST `/api/v1/checkin/online`
線上報到

**Request:**
```json
{
  "appointmentId": "string (UUID)"
}
```

**Response:**
```json
{
  "checkinId": "string (UUID)",
  "appointmentId": "string (UUID)",
  "patientId": "string (UUID)",
  "checkinTime": "string (ISO 8601)",
  "checkinMethod": "online",
  "ticketSequence": number,
  "ticketNumber": "string"
}
```

##### POST `/api/v1/checkin/onsite`
現場報到

**Request:**
```json
{
  "cardNumber": "string"
}
```

**Response:** 同線上報到

##### GET `/api/v1/checkin/queue/{appointmentId}`
取得候診資訊

**Response:**
```json
{
  "currentNumber": number,
  "myNumber": number,
  "waitingAhead": number,
  "estimatedWaitTime": number
}
```

#### 5. 病歷相關 (Medical Records)

##### GET `/api/v1/medical-records`
查詢病歷

**Query Parameters:**
- `patientId`: string (optional)
- `doctorId`: string (optional)

**Response:**
```json
[
  {
    "recordId": "string (UUID)",
    "patientId": "string (UUID)",
    "patientName": "string",
    "doctorId": "string (UUID)",
    "doctorName": "string",
    "createdAt": "string (ISO 8601)",
    "summary": "string"
  }
]
```

##### POST `/api/v1/medical-records`
建立病歷（醫生）

**Request:**
```json
{
  "patientId": "string (UUID)",
  "summary": "string"
}
```

##### PUT `/api/v1/medical-records/{id}`
更新病歷

##### DELETE `/api/v1/medical-records/{id}`
刪除病歷

#### 6. 停診申請 (Leave Requests)

##### POST `/api/v1/leave-requests`
申請停診（醫生）

**Request:**
```json
{
  "date": "string (YYYY-MM-DD)",
  "timePeriod": "morning" | "afternoon" | "evening",
  "reason": "string"
}
```

**Response:**
```json
{
  "requestId": "string (UUID)",
  "doctorId": "string (UUID)",
  "doctorName": "string",
  "date": "string (YYYY-MM-DD)",
  "timePeriod": "string",
  "reason": "string",
  "status": "pending" | "approved" | "rejected",
  "createdAt": "string (ISO 8601)"
}
```

##### GET `/api/v1/leave-requests`
取得停診申請列表

##### POST `/api/v1/leave-requests/{id}/approve`
核准停診申請（管理員）

##### POST `/api/v1/leave-requests/{id}/reject`
拒絕停診申請（管理員）

**Request:**
```json
{
  "reason": "string"
}
```

#### 7. 審計日誌 (Audit Logs)

##### GET `/api/v1/audit-logs`
查詢審計日誌（管理員）

**Query Parameters:**
- `startDate`: string (optional, YYYY-MM-DD)
- `endDate`: string (optional, YYYY-MM-DD)
- `userId`: string (optional, UUID)
- `action`: string (optional, CREATE | UPDATE | DELETE | VIEW)

**Response:**
```json
[
  {
    "logId": "string (UUID)",
    "userId": "string (UUID)",
    "userName": "string",
    "action": "CREATE" | "UPDATE" | "DELETE" | "VIEW",
    "timestamp": "string (ISO 8601)",
    "targetId": "string (optional)",
    "metadata": {} // JSON object
  }
]
```

##### GET `/api/v1/audit-logs/export`
匯出審計日誌

**Query Parameters:**
- `startDate`: string (optional)
- `endDate`: string (optional)
- `format`: "csv" | "json" (optional, default: "csv")

**Response:** Blob (檔案下載)

#### 8. 帳號管理 (Accounts) - 管理員專用

##### GET `/api/v1/accounts`
取得帳號列表

**Query Parameters:**
- `role`: string (optional, patient | doctor | admin)

**Response:**
```json
[
  {
    "id": "string (UUID)",
    "name": "string",
    "email": "string",
    "role": "patient" | "doctor" | "admin",
    "cardNumber": "string (optional)",
    "specialty": "string (optional)"
  }
]
```

##### POST `/api/v1/accounts`
建立帳號

**Request:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "patient" | "doctor" | "admin",
  "cardNumber": "string (optional, 病患必填)",
  "specialty": "string (optional, 醫生必填)"
}
```

##### PUT `/api/v1/accounts/{id}`
更新帳號

##### DELETE `/api/v1/accounts/{id}`
刪除帳號

### 錯誤處理

前端期望的錯誤回應格式：

```json
{
  "message": "錯誤訊息"
}
```

HTTP 狀態碼對應：
- `400`: 請求參數錯誤
- `401`: 未授權（token 無效或過期）
- `403`: 權限不足
- `404`: 資源不存在
- `409`: 衝突（例如：時段已滿）
- `500`: 伺服器錯誤

### 資料格式規範

- **日期格式**: `YYYY-MM-DD` (例如: `2024-01-15`)
- **時間格式**: `HH:mm` (例如: `09:00`, `14:30`)
- **日期時間格式**: ISO 8601 (例如: `2024-01-15T09:00:00Z`)
- **UUID**: 標準 UUID v4 格式
- **時段**: `morning` | `afternoon` | `evening`

### 與設計文件對應

本前端專案對應的後端設計文件為 `software-design-document.md`，後端工程師應參考：

1. **資料庫設計**: 參考設計文件中的資料表結構
2. **API 路由**: 參考設計文件中的 Controller -> Service -> Repository 架構
3. **業務邏輯**: 參考設計文件中的 Use Case 規格
4. **技術堆疊**: 後端應使用 FastAPI + SQLAlchemy + PostgreSQL

### 開發建議

1. **CORS 設定**: 後端需允許前端來源 (`http://localhost:3000`) 的跨域請求
2. **API 文件**: 建議使用 FastAPI 自動生成的 OpenAPI 文件（Swagger UI）
3. **測試帳號**: 開發階段可參考前端的 `mockData.ts` 建立測試資料
4. **環境變數**: 建議使用環境變數管理 API 基礎路徑和認證設定

### 環境變數

可在專案根目錄建立 `.env` 檔案：

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## 開發規範

- 使用 TypeScript 進行類型檢查
- 遵循 React Hooks 最佳實踐
- 使用 Tailwind CSS 進行樣式設計
- 所有 API 呼叫透過 `services/api.ts` 統一管理
- 使用 Context API 管理全域狀態（認證）

## 瀏覽器支援

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 授權

本專案為醫院掛號系統前端應用。
