# Architecture: Unified Users Table (方案 A)

目標
------
本文件說明「方案 A：統一 users 表 + role 延伸」的完整設計與實作步驟，供 Architect 與資料庫/後端工程師採納。目的在於：

- 統一身份驗證與帳號管理（登入、密碼重設、MFA、鎖定等）。
- 使審計、授權（RBAC）與帳號關聯在 DB 層具可追溯性與 FK 約束。
- 簡化應用程式的驗證邏輯與跨實體操作的追蹤（created_by / approved_by 等欄位）。

高階設計概念
----------------
1. 建立核心 `users` 表作為所有登入帳號的來源（email / password_hash / role / status 等）。
2. 對目前 domain tables（patient / doctor / admin）保留或變更為 profile/detail tables，並用 `user_id` FK 指回 `users.user_id`。
3. 讓業務資料表（appointment / medical_record / audit_log 等）在需要追蹤操作者時，使用 `created_by` / `updated_by` 等欄位參考 `users.user_id`，以在 DB 層建立完整可追溯關聯。

優點（為何採用）
-------------------
- 單一認證來源：簡化登入邏輯、頻繁查詢（例如 login attempts、lockout）只需查 `users`。
- RBAC 與授權更易維運：role 欄位或 role table 可直接與權限服務相連。
- 審計一致性：所有審計紀錄可直接 FK 到 `users`，便於稽核與查詢。

ERD（簡化示意，Mermaid）
-------------------------
```mermaid
erDiagram
    USERS {
        UUID user_id PK
        string email
        string password_hash
        string role
        boolean is_active
        timestamp created_at
    }
    PATIENT {
        UUID patient_id PK
        UUID user_id FK
        string card_number
        string name
        date dob
    }
    DOCTOR {
        UUID doctor_id PK
        UUID user_id FK
        string doctor_login_id
        string name
        string specialty
    }
    ADMIN {
        UUID admin_id PK
        UUID user_id FK
        string name
    }
    APPOINTMENT {
        UUID appointment_id PK
        UUID patient_id FK
        UUID doctor_id FK
        timestamp start_time
        timestamp end_time
        string status
        UUID created_by FK -> USERS.user_id
    }
    MEDICAL_RECORD {
        UUID record_id PK
        UUID patient_id FK
        UUID doctor_id FK
        timestamp created_at
        text summary
        UUID created_by FK -> USERS.user_id
    }
    AUDIT_LOG {
        UUID log_id PK
        UUID actor_user_id FK -> USERS.user_id
        string action
        timestamp timestamp
        string target_type
        UUID target_id
    }

    USERS ||--o{ PATIENT : "has profile"
    USERS ||--o{ DOCTOR : "has profile"
    USERS ||--o{ ADMIN : "has profile"
    PATIENT ||--o{ APPOINTMENT : "books"
    DOCTOR ||--o{ APPOINTMENT : "receives"
    PATIENT ||--o{ MEDICAL_RECORD : "has"
    DOCTOR ||--o{ MEDICAL_RECORD : "authors"
    USERS ||--o{ AUDIT_LOG : "performs"
```

PostgreSQL DDL（建議實作）
---------------------------------
下面的 DDL 為參考範例，會建立 `users` 主表、profile tables 以及把業務表的 created_by 指向 users：

```sql
-- extension for UUID generation (Postgres)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL, -- consider ENUM or lookup table
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE patient (
  patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  card_number TEXT UNIQUE,
  name TEXT NOT NULL,
  dob DATE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE doctor (
  doctor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  doctor_login_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE admin (
  admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- example: appointment with created_by FK
CREATE TABLE appointment (
  appointment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (patient_id) REFERENCES patient(patient_id),
  FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE medical_record (
  record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  summary TEXT,
  created_by UUID,
  FOREIGN KEY (patient_id) REFERENCES patient(patient_id),
  FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE audit_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  action TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  target_type TEXT,
  target_id UUID,
  FOREIGN KEY (actor_user_id) REFERENCES users(user_id)
);
```

遷移策略（現有 patient/doctor/admin 欄位要如何合併到 users）
-------------------------------------------------------------
步驟總覽（無 downtime 小心執行或短暫 maintenance window）：

1. 建立 `users` 表（DDL 如上），並建立必要索引。
2. 為每個現有在用的 patient / doctor / admin row 產生一筆 users row：
   - patient：使用 patient.email 或 phone 產生 users.email（若 email 缺失，需先要求填補或使用臨時占位並標示為 unverified）。
   - doctor：使用 existing doctor_login_id 或 email 產生 users row，role='doctor'。
   - admin：使用 admin.email 產生 users row，role='admin'。
3. 在 patient/doctor/admin 表新增 `user_id` 欄位 NULLable，並且寫入對應的 users.user_id。
4. 在測試環境完整驗證：確保每個使用者可用 users 表登入（email/password），並且關聯不破壞現有查詢。
5. 在確認無誤後，將 patient.user_id / doctor.user_id / admin.user_id 設為 NOT NULL 與 UNIQUE（視需求），並加入 FK 約束（ON DELETE CASCADE 或 RESTRICT 視策略）。
6. 把應用程式登入邏輯更新為查 users 表；並把 created_by/approved_by 等欄位切換為 FK 參考 users.user_id。
7. 清理：移除舊的 password 欄位（若存在且複製到 users）並保留紀錄或備份。建立監控以觀察登入錯誤與使用者驗證漏失。

示範 SQL：從 patient -> users 的簡化填寫舉例（注意：實務上需處理 email 缺失、hash 相容等問題）

```sql
-- 1) 建 users 資料，對已有 email 的 patient
INSERT INTO users (user_id, email, password_hash, role, created_at)
SELECT gen_random_uuid(), email, password_hash, 'patient', now()
FROM patient
WHERE email IS NOT NULL;

-- 2) 對沒有 email 的 patient，建立 users 但標記 email 為 placeholder 或要求補件
-- 3) 把剛建立的 users.user_id 更新回 patient.user_id 欄位（示意）
UPDATE patient p
SET user_id = u.user_id
FROM users u
WHERE p.email = u.email AND u.role = 'patient';

-- 4) 同理處理 doctor & admin
```

回滾策略（Rollback）
-----------------------
- 在每一步遷移前建立資料備份（快照或匯出）。
- 若發現問題，先停止應用層使用新的 users flow，回退應用程式，並用備份還原 patient/doctor/admin 的原始狀態。

安全性與密碼建議
-------------------
- 密碼哈希：建議使用 Argon2id 或 bcrypt（Argon2id 推薦），不要使用自製雜湊。配置適當 cost/salt/內存參數。
- 密鑰管理：若需要可逆加密（例如保護 card_number 等），請使用 KMS（雲端金鑰管理）或本地 HSM。不要將金鑰寫進代碼庫。
- MFA：支援 TOTP（例如 RFC6238）與 FIDO2 硬體金鑰作為進階選項。
- 密碼重設：採用一次性驗證碼（OTP），短時間內有效，且重設事件要寫入審計日誌。

索引與效能建議
------------------
- users(email) UNIQUE
- patient(card_number) UNIQUE
- doctor(doctor_login_id) UNIQUE
- appointment(created_by) 的 FK 會自然建立索引，但可根據查詢模式建立複合索引（例如 appointment(doctor_id, start_time)）。

測試清單（關鍵驗收項）
-----------------------
1. 測試帳號建立：patient/doctor/admin 均可透過新流程註冊、登入與重設密碼。
2. 測試 FK：appointment.created_by 能正確 Join users，audit_log.actor_user_id 指向正確 user。
3. 回歸測試：現有 API 行為（預約、報到、班表查詢）在整合後不會破壞。
4. 安全測試：密碼欄位不可被查詢以明文；確認使用 Argon2 驗證流程正確。

風險評估與備註
------------------
- 風險：資料遷移時若 email 缺失或 password 演算法不相容，需採用使用者重設密碼流程。
- 監控：部署後密切監控登入失敗率、錯誤日誌與使用者支援工單量，若異常上升需回滾。

交付物
--------
1. 本文件（`arch_unified_users_plan.md`）。
2. 完整 Postgres DDL（含索引與 FK）。
3. 初版遷移 SQL 範例（示意），與詳細遷移計劃（可另存）。

下一步
--------
請確認你想要我：
- A1：把上述 DDL 與遷移 SQL 實作成單一 SQL 檔案（可在測試環境直接執行），或
- A2：我把變更直接寫回 `prd_1.md` 的資料庫設計章節並更新 ERD（目前是分開文件），或
- A3：產出詳細遷移計劃（含每個階段的回滾 SQL 與時間估算）。

請回覆你要哪一個，我會立即執行。 
