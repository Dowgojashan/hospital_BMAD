# Project Management Plan — 線上醫院掛號與診務系統

版本：0.1
作者：Product Manager
來源：`project-brief.md`，基於 `prd-and-planning-draft.md`

---

## 一、專案範疇（Scope / MVP Boundary）
- 納入：六大核心模組
  1. 使用者與身分管理（User Management）
  2. 門診與班表管理（Clinic & Schedule Management）
  3. 線上掛號與預約（Registration & Scheduling）
  4. 到診報到與候診排隊（Check-in & Queue Management）
  5. 病歷資料管理（Electronic Health Record Management）
  6. 診務通訊與管理儀表板（Communication & Admin Dashboard）

- 明確排除（MVP）：
  - 排除急診特殊流程與急診資源調度（不處理急診分流、急救優先權）。
  - 排除遠距醫療／視訊診療功能（符合法規限制）。
  - 排除第三方線上付費或保險理賠整合（可作為後續擴充）。

## 二、初步時程估算（Initial Timeline — 12 週建議）
說明：以週為單位的高階開發節奏，假設團隊以敏捷雙週迭代（2 週 Sprint）執行。

- Week 0: 啟動與需求細化（Stakeholder workshop、法務/資安檢視、架構預研）
- Week 1–3 (3w): Epic A — 使用者與身分管理（設計、基礎身分驗證、RBAC）
- Week 4–5 (2w): Epic B — 門診與班表管理（查詢介面、班表 CRUD、停診流程）
- Week 6–7 (2w): Epic C — 線上掛號與預約（時段查詢、預約建立、提醒）
- Week 8–9 (2w): Epic D — 到診報到與候診排隊（報到、Kiosk 流程、過號處理）
- Week 10 (1w): Epic E — 病歷資料管理（只讀查詢 + 醫師審核的編輯流程）
- Week 11 (1w): Epic F — 診務通訊與管理儀表板（通知管線、儀表板基本 KPI）
- Week 12: 巡檢、修正、試點準備與上線前合規檢核

備註：時程可依醫院可用資源、API/整合複雜度進行調整；若病歷整合複雜度高，可能需將 Epic E 延伸為 2–3 週。

## 三、資源要求（Core Team｜初步）
- 1 Product Manager (兼任專案負責)
- 1 UX / UI 設計師
- 2 Backend 開發
- 1 Frontend 開發
- 1 QA / 測試工程師
- 1 DevOps / SRE（兼職可行）
- 1 臨床業務聯絡人（Hospital Liaison）

建議：視整合需求增派 0.5 FTE 資安/合規工程師與 0.5 FTE 資料工程師。

## 四、風險與外部依賴（Top Risks & Dependencies）

主要技術風險（Top 3）：
1. 與醫院既有 HIS/EHR 的資料整合難度（API 不一致或無 API，需人工作業）。
2. 病歷資料同步與資料一致性問題（寫入/編輯權限與審計需求）。
3. 通知送達可靠性（依賴外部 SMS/Email/Push 供應商）。

主要外部依賴（Top 2）：
1. 法務/合規審查與醫院資訊安全規範批准（影響上線時程）。
2. 醫院提供資料介面（API 或批次匯出）與內部測試環境／匿名測試資料。

---

文件：`project-management-plan.md` 完成，作為「文件 A」交付。
