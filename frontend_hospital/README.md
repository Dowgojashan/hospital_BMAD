# 智慧醫院管理系統 - 前端專案

這是一個基於 React + TypeScript 的醫院掛號與診務管理系統前端專案，採用藍白專業醫院風格設計。

## 專案結構

```
frontend_hospital/
├── public/                 # 靜態資源
├── src/
│   ├── components/         # 共用組件
│   │   ├── Navbar.tsx      # 導航欄
│   │   └── ProtectedRoute.tsx  # 路由保護組件
│   ├── pages/              # 頁面組件
│   │   ├── Login.tsx       # 登入頁面
│   │   ├── Register.tsx    # 註冊頁面
│   │   ├── Home.tsx        # 首頁
│   │   ├── Appointments.tsx # 我的預約
│   │   ├── BookAppointment.tsx # 線上掛號
│   │   ├── CheckIn.tsx     # 報到頁面
│   │   ├── Schedules.tsx    # 查詢班表
│   │   ├── MedicalRecords.tsx # 我的病歷
│   │   ├── Profile.tsx     # 個人資料
│   │   ├── admin/          # 管理員頁面
│   │   │   ├── Dashboard.tsx        # 儀表板
│   │   │   ├── ScheduleManagement.tsx # 班表管理
│   │   │   ├── UserManagement.tsx   # 帳號管理
│   │   │   └── AuditLog.tsx         # 審計日誌
│   │   └── doctor/         # 醫師頁面
│   │       ├── DoctorSchedules.tsx  # 我的班表
│   │       ├── LeaveRequest.tsx      # 停診申請
│   │       └── DoctorRecords.tsx    # 病歷管理
│   ├── services/           # API 服務
│   │   ├── api.ts          # Axios 配置
│   │   ├── authService.ts  # 認證服務
│   │   ├── appointmentService.ts # 預約服務
│   │   ├── scheduleService.ts     # 班表服務
│   │   ├── checkInService.ts      # 報到服務
│   │   ├── medicalRecordService.ts # 病歷服務
│   │   └── dashboardService.ts    # 儀表板服務
│   ├── types/              # TypeScript 類型定義
│   │   └── index.ts
│   ├── App.tsx             # 主應用組件
│   ├── App.css             # 應用樣式
│   ├── index.tsx           # 入口文件
│   └── index.css           # 全局樣式
├── package.json
└── tsconfig.json
```

## 功能模組

### 1. 使用者與身分管理
- ✅ 病患註冊
- ✅ 使用者登入/登出
- ✅ 修改個人資料
- ⚠️ 管理員帳號管理 (部分實作)

### 2. 門診與班表管理
- ✅ 查詢醫生班表
- ✅ 管理員班表管理 (新增/修改/刪除)
- ✅ 醫生查看個人班表
- ⚠️ 醫生停診申請 (部分實作)

### 3. 線上掛號
- ✅ 病患新增掛號
- ✅ 病患查詢掛號結果
- ✅ 病患修改/取消掛號

### 4. 報到
- ✅ 病患線上報到
- ✅ 即時看診資訊
- ⚠️ 現場報到 (需後端支援)
- ⚠️ 過號/爽約懲罰 (需後端支援)

### 5. 病歷
- ✅ 歷史病歷查詢
- ✅ 醫生新增/修改/刪除病歷
- ✅ 審計日誌檢視

### 6. 診務通知與管理儀表板
- ✅ 門診流量儀表板
- ⚠️ 掛號結果通知 (需後端支援)
- ⚠️ 看診提醒通知 (需後端支援)

## 安裝與執行

### 前置需求
- Node.js 14.0 或更高版本
- npm 或 yarn

### 安裝依賴
```bash
cd frontend_hospital
npm install
```

### 開發模式
```bash
npm start
```

應用程式將在 http://localhost:3000 啟動

### 建置生產版本
```bash
npm run build
```

## 環境變數

在專案根目錄建立 `.env` 文件：

```
REACT_APP_API_URL=http://localhost:3001/api
```

## 設計風格

專案採用藍白專業醫院風格，主要顏色：
- 主色調：`#0066cc` (專業藍)
- 輔助色：`#4a90e2` (淺藍)
- 背景色：`#f5f7fa` (淺灰)
- 強調色：`#e6f2ff` (淡藍)

## 角色權限

### 病患 (Patient)
- 註冊/登入
- 查詢班表
- 線上掛號
- 查看/修改/取消預約
- 線上報到
- 查看病歷

### 醫師 (Doctor)
- 登入
- 查看個人班表
- 申請停診
- 管理病歷 (新增/修改/刪除)

### 管理員 (Administrator)
- 登入
- 管理所有帳號
- 管理班表
- 查看儀表板
- 查看審計日誌

## API 整合

所有 API 服務位於 `src/services/` 目錄下。預設 API 基礎 URL 為 `http://localhost:3001/api`，可透過環境變數 `REACT_APP_API_URL` 修改。

### 認證
- Token 儲存在 localStorage
- 請求自動附加 Authorization header
- 401 錯誤自動跳轉登入頁

## 待完成功能

- [ ] 管理員帳號完整 CRUD
- [ ] 醫生停診申請完整流程
- [ ] 現場報到功能
- [ ] 過號/爽約懲罰機制
- [ ] 通知系統整合
- [ ] 響應式設計優化
- [ ] 錯誤處理完善
- [ ] 表單驗證加強

## 技術棧

- React 19.2
- TypeScript 4.9
- React Router 7.9
- Axios 1.13
- CSS3 (自定義主題)

## 授權

此專案為醫院管理系統前端實作，僅供學習與開發使用。
