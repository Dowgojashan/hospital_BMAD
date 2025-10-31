## 物件設計文件藍圖：Epic C & D 拆解

### 總體任務清單 (Task Summary)
| Story ID | 標題 |
|---:|---|
| C-1 | API：建立預約請求驗證與授權 (Create Appointment — API Validation) |
| C-2 | Service：預約核心邏輯與鎖定 (Atomic Reservation with Locking) |
| C-3 | 候補機制：Waitlist 管理 (Waitlist Handling) |
| C-4 | 過號/爽約懲罰：Infraction 與處罰套用 (No-show / Penalty Logic) |
| C-5 | 醫師班表管理：Schedule CRUD 與衝突偵測 (Schedule Management) |
| C-6 | 停診處理：取消班表與 cascade 取消預約 (Cancel Schedule & Notify) |
| D-1 | 機台報到：身份驗證與預約查找 (Kiosk Identity Verification) |
| D-2 | 機台報到：序號分配與建立報到紀錄 (Sequence Allocation & Checkin Creation) |
| D-3 | 叫號管理：Call / Recall / Skip (VisitCall control) |
| D-4 | 插隊管理：計算插隊位置與插隊策略 (InsertAhead / Virtual Position) |
| D-5 | 通知/顯示：票卡顯示與通知櫃檯/病患 (Ticket Display & Notification) |
| D-6 | RoomDay 管理：每日序號重置與一致性 (Daily Reset & RoomDay) |

---

### Story C-1: API：建立預約請求驗證與授權 (Create Appointment — API Validation)

User Story 標題
- API: Create Appointment — Request validation & auth

Acceptance Criteria
- 未登入或 token 無效回 401。
- 必要欄位 (patientId, doctorId, date, timePeriod) 欠缺或格式錯誤回 400 並返回錯誤細節。
- 若 `PATIENT.suspended_until` 在未來，API 回 403（禁止線上預約）。
- 驗證通過後呼叫 `AppointmentService.reserve()` 並回 201（成功）或 202 / 409（候補 / 衝突）依情境。

技術指南（物件設計）
- 需操作的資料表：
  - `PATIENT`（查驗 suspended_until、card_number）
  - `DOCTOR`（驗證 doctor 存在）
  - `APPOINTMENT`（之後由 Service 寫入）
- 需調用的 Service 方法：
  - `AuthService.verifyToken(token)`
  - `PatientRepository.findById(patientId)`
  - `DoctorRepository.findById(doctorId)`
  - `AppointmentService.reserve(patientId, doctorId, date, timePeriod)`
- 特殊邏輯說明：
  - API 層僅負責授權與資料格式驗證，不執行 DB 鎖定或長交易。
  - 建議支援 Idempotency-Key header，以避免重複請求導致重複預約。
  - 回應應包含 correlationId 供追蹤。

---

### Story C-2: Service：預約核心邏輯與鎖定 (Atomic Reservation with Locking)

User Story 標題
- AppointmentService.reserve() — atomic reservation with locking

Acceptance Criteria
- 若班次尚有名額，應在單一 transaction 中建立 `APPOINTMENT`，回 201，並觸發通知。
- 若名額已滿，回 409 或建立一筆 candidate `APPOINTMENT`（status='waitlist'）並回傳候補位置。
- 在高併發下不得超賣（no oversell）。

技術指南（物件設計）
- 需操作的資料表：
  - `SCHEDULE`（檢查班表與狀態）
  - `APPOINTMENT`（寫入預約）
  - `ROOM_DAY` / `DayCounter`（若同步分配序號）
  - `AUDIT_LOG`（記錄操作）
- 需調用的 Service / Repository 方法：
  - `AppointmentService.reserve(patientId, doctorId, date, timePeriod)`
  - `ScheduleRepository.findForUpdate(doctorId, date, timePeriod)` — SELECT ... FOR UPDATE
  - `AppointmentRepository.countExistingAppointments(doctorId, date, timePeriod)`
  - `AppointmentRepository.create(appointment)`
  - `RoomDayRepository.incrementNextSequence(roomId, date)`（若同步發序號）
  - `NotificationService.notifyPatient(appointment)`
  - `AuditService.record(...)`
- 特殊邏輯說明：
  - 實作步驟（建議）：
    1. BEGIN TRANSACTION。
    2. SELECT schedule (或 room_day) FOR UPDATE 鎖定該時段 row（悲觀鎖），避免並發超賣。
    3. COUNT 現有有效 APPOINTMENT（狀態非 cancelled/no_show）。
    4. 若 count < capacity，INSERT APPOINTMENT。
    5. （選用）若需票卡序號，在同一 transaction 進行 RoomDay.next_sequence +=1 並取得序號。
    6. INSERT AUDIT_LOG。
    7. COMMIT。
  - 若 transaction 因鎖競爭或死鎖失敗，採短次數重試（含退避）。

---

### Story C-3: 候補機制：Waitlist 管理 (Waitlist Handling)

User Story 標題
- Waitlist Service — add/remove patients when full

Acceptance Criteria
- 當時段滿額時，能將請求加入候補並返回候補順位。
- 當有人取消或容量釋放時，可 promotion 候補者為正式預約並通知（原子性）。
- 使用者可查詢與取消候補。

技術指南（物件設計）
- 需操作的資料表：
  - `APPOINTMENT`（status 可為 'waitlist' 或 'scheduled'）
  - optional `WAITLIST` table（若使用專表）
  - `SCHEDULE`, `AUDIT_LOG`
- 需調用的方法：
  - `WaitlistService.addToWaitlist(patientId, doctorId, date, timePeriod)`
  - `WaitlistService.getPosition(patientId, slotKey)`
  - `WaitlistService.promoteNext(slotKey)` — 由 cancel 流程觸發
  - `AppointmentRepository.updateStatus(appointmentId, 'confirmed')`
  - `NotificationService.notifyPatientPromoted(...)`
- 特殊邏輯說明：
  - 若使用 `WAITLIST` 專表，使用 created_at 作為 FIFO key；promotion 必須在 transaction 內執行 SELECT ... FOR UPDATE (room_day / schedule) -> pop waitlist -> update appointment。
  - promotion 若失敗 (patient 已過期/拒絕)，自動 promotion 下一位並記錄 log。

---

### Story C-4: 過號/爽約懲罰：Infraction 與處罰套用 (No-show / Penalty Logic)

User Story 標題
- Infraction handling — mark no-show & apply penalty (suspended_until)

Acceptance Criteria
- 判定為 no-show 時，建立 `INFRACTION` 並視規則更新 `PATIENT.suspended_until`。
- Infraction 寫入不可被刪除，且同時寫入 `AUDIT_LOG`。
- 若病患 suspended，API/UI 阻止線上預約或線上報到（403）。

技術指南（物件設計）
- 需操作的資料表：
  - `APPOINTMENT`（更新 status='no_show'）
  - `INFRACTION`（INSERT）
  - `PATIENT`（UPDATE suspended_until）
  - `AUDIT_LOG`
- 需調用的方法：
  - `AppointmentService.markNoShow(appointmentId)`
  - `InfractionService.createInfraction(patientId, appointmentId, type, occurredAt, penaltyApplied, penaltyUntil)`
  - `PatientRepository.updateSuspendedUntil(patientId, date)`
  - `AuditService.record(...)`
- 特殊邏輯說明：
  - 若為批次 job 判定 no-show（例如每日跑批），建議以 transaction 更新 appointment -> insert infraction -> update patient（若套用 penalty）。
  - Penalty 計算規則（例如禁線上報到 X 天）要從 PRD 明確化；應在同一 transaction 或採補償機制以保持一致性。
  - 記錄發生來源（system job 或 manual operator）。

---

### Story C-5: 醫師班表管理：Schedule CRUD 與衝突偵測 (Schedule Management)

User Story 標題
- Schedule Management — create/update schedule with conflict detection

Acceptance Criteria
- 建立/更新班表時若有時間衝突回 409 並提供衝突班次資訊。
- 成功建立的班表可被 `AppointmentService.reserve()` 查詢到並被鎖定。

技術指南（物件設計）
- 需操作的資料表：
  - `SCHEDULE`
  - `APPOINTMENT`（檢查變更是否影響既有預約）
  - `AUDIT_LOG`
- 需調用的方法：
  - `ScheduleService.createSchedule(doctorId, date, start, end)`
  - `ScheduleRepository.findOverlapping(doctorId, date, start, end)`
  - `ScheduleRepository.create(schedule)`
  - `ScheduleService.validateAgainstAppointments(scheduleId, newStatus)`
- 特殊邏輯說明：
  - 衝突檢查可用 SELECT 範圍查詢（no FOR UPDATE 必要），回傳衝突資訊供 UI 顯示。
  - 若變更會影響 APPOINTMENT（刪除/取消班表），應觸發 C-6 的取消流程。

---

### Story C-6: 停診處理：取消班表與 cascade 取消預約 (Cancel Schedule & Notify)

User Story 標題
- Doctor schedule cancelation — cascade appointments and notify

Acceptance Criteria
- 醫師停診後，SCHEDULE 標為 cancelled；該時段的 `APPOINTMENT`（scheduled/confirmed）皆標為 cancelled 並記錄 reason。
- 取消操作在 DB 保持一致性，並產生通知（非同步）與 `AUDIT_LOG` 紀錄。

技術指南（物件設計）
- 需操作的資料表：
  - `SCHEDULE`, `APPOINTMENT`, `AUDIT_LOG`
- 需調用的方法：
  - `ScheduleService.cancelSchedule(scheduleId, reason)`
  - `AppointmentRepository.findAffectedAppointments(scheduleId)`
  - `AppointmentRepository.bulkUpdateStatus(appointmentIds, 'cancelled', reason)`
  - `NotificationService.notifyPatients(appointments, message)`
  - `AuditService.record(...)`
- 特殊邏輯說明：
  - 建議步驟：
    1. BEGIN TRANSACTION。
    2. UPDATE schedule set status='cancelled' WHERE schedule_id=...。
    3. SELECT affected appointments。
    4. UPDATE appointment SET status='cancelled' WHERE id IN (...)（批次分段以避免單筆 transaction 過大）。
    5. INSERT audit log。
    6. COMMIT。
  - Notification 可在 transaction 後以非同步方式發送；若大量通知，採 MQ 與 DLQ。

---

### Story D-1: 機台報到：身份驗證與預約查找 (Kiosk Identity Verification)

User Story 標題
- Kiosk Check-in — Card number verification & appointment lookup

Acceptance Criteria
- 輸入 card_number 能找到 `PATIENT`，否則回 404。
- 若 `PATIENT.suspended_until` 在未來，回 403 阻止線上報到。
- 若存在當日預約，回傳預約摘要（doctor, date, time_period, appointmentId）。
- 身份驗證成功後方進入序號分配。

技術指南（物件設計）
- 需操作的資料表：
  - `PATIENT`（find by card_number, check suspended_until）
  - `APPOINTMENT`（find today's appointment）
  - `SCHEDULE`（如需核對）
- 需調用的方法：
  - `PatientRepository.findByCardNumber(cardNumber)`
  - `AppointmentRepository.findTodayAppointment(patientId, date)`
  - `CheckinService.validatePatientForCheckin(patient, appointment?)`
- 特殊邏輯說明：
  - 要求不在 log 中寫入完整 card_number（PII 保護）。
  - 若找不到當日預約，系統應允許臨時號（guest check-in）或提示到櫃檯處理。

---

### Story D-2: 機台報到：序號分配與建立報到紀錄 (Sequence Allocation & Checkin Creation)

User Story 標題
- Kiosk Check-in — allocate ticket sequence and create CHECKIN + VisitCall

Acceptance Criteria
- 在 transaction 中原子性取得 `ROOM_DAY.next_sequence`（SELECT ... FOR UPDATE，然後 UPDATE next_sequence = next_sequence + 1 RETURNING new value）。
- 成功插入 `VISIT_CALL` 與 `CHECKIN`，回傳 ticket info (sequence & formatted ticket_number)。
- 在併發情況下不會有重複序號。

技術指南（物件設計）
- 需操作的資料表：
  - `ROOM_DAY`（SELECT ... FOR UPDATE，UPDATE next_sequence）
  - `VISIT_CALL`（INSERT）
  - `CHECKIN`（INSERT）
  - `APPOINTMENT`（可能更新 status='checked_in'）
  - `AUDIT_LOG`
- 需調用的方法：
  - `RoomDayRepository.getForUpdate(roomId, date)`
  - `RoomDayRepository.incrementNextSequence(roomDayId)` → returns new_sequence
  - `VisitCallRepository.create(callRecord)`
  - `CheckinRepository.create(checkinRecord)`
  - `CheckinService.createCheckinFromKiosk(patientId, appointmentId?, roomId)`
- 特殊邏輯說明：
  - 建議步驟：
    1. BEGIN TRANSACTION。
    2. SELECT room_day FOR UPDATE WHERE room_id=... AND date=...。
    3. UPDATE next_sequence = next_sequence + 1 RETURNING next_sequence。
    4. INSERT visit_call (ticket_sequence=new_sequence)。
    5. INSERT checkin (ticket_sequence=new_sequence)；若有 appointment，更新 appointment.status='checked_in'。
    6. INSERT audit_log。
    7. COMMIT。
  - ticket_number 格式可為 `{YYYYMMDD}-{ROOM}-{sequence}`，由 application 層格式化。
  - 若 transaction 失敗，執行短重試。

---

### Story D-3: 叫號管理：Call / Recall / Skip (VisitCall control)

User Story 標題
- VisitCall control — call / recall / skip actions for queue operators

Acceptance Criteria
- 操作員能執行 call / recall / skip，系統在 `VISIT_CALL` 中寫入 call_type 與 call_status。
- 當病患回應（attended）時，`CHECKIN` 標記為 attended 並產生相應 `AUDIT_LOG`。
- 叫號歷史可被查詢與報表匯出。

技術指南（物件設計）
- 需操作的資料表：
  - `VISIT_CALL`, `CHECKIN`, `ROOM_DAY`, `AUDIT_LOG`, `INFRACTION`（如 skip 導致 no-show）
- 需調用的方法：
  - `VisitCallService.callNext(roomId)` — 建立新的 call 記錄
  - `VisitCallService.recall(callId)` — create recall or update status
  - `VisitCallService.skip(callId)` — mark expired / schedule next
  - `CheckinRepository.updateStatus(checkinId, 'attended')`
  - `AuditService.record(...)`
- 特殊邏輯說明：
  - callNext 可在 DB 讀取尚未被叫的最早 `CHECKIN` 並 INSERT `VISIT_CALL`；若無則回空。
  - skip 若多次且符合 no-show 規則，觸發 C-4 的 Infraction 流程（INSERT infraction + update patient penalty）。
  - VisitCall 設計為 append-only 歷史記錄，便於稽核。

---

### Story D-4: 插隊管理：計算插隊位置與插隊策略 (InsertAhead / Virtual Position)

User Story 標題
- InsertAhead — compute insertion at (current called + N) position

Acceptance Criteria
- 系統能計算並分配插隊位置（例如 current_called + 3），並確保不會造成序號重複或違反已叫號邏輯。
- 插隊會建立相應的 `VISIT_CALL` / `CHECKIN` 記錄或設定 priority flag，並寫入 `AUDIT_LOG`。
- 若插隊無法被滿足（超出當日上限），回傳錯誤或建議下一可用位置。

技術指南（物件設計）
- 需操作的資料表：
  - `ROOM_DAY`（current_called_sequence, next_sequence）
  - `VISIT_CALL`, `CHECKIN`
- 需調用的方法：
  - `QueueService.insertAtOffset(roomId, offset)`：
    - 1) SELECT room_day FOR UPDATE；
    - 2) 計算 target_sequence = current_called_sequence + offset；
    - 3) 若支援物理重編號，需在 transaction 中調整 affected rows（注意效率）；建議採「priority + created_at」策略以避免大量 UPDATE。
  - `VisitCallRepository.create(callRecord)` 或 `CheckinRepository.createWithPriority()`
- 特殊邏輯說明：
  - 強烈建議避免大量實際重新編號 ticket_sequence；建議使用 priority/virtual position（例如 priority 值與 created_at 作為排序鍵）。
  - 若必須保留實際數字，需在 transaction 中更新範圍內的多筆 row 並小心死鎖。

---

### Story D-5: 通知/顯示：票卡顯示與通知櫃檯/病患 (Ticket Display & Notification)

User Story 標題
- Ticket display & notify desk when issued/called

Acceptance Criteria
- 建立票卡或叫號時應推送訊息到櫃檯顯示系統（WebSocket 或 MQ）。
- 若 patient 同意並具備聯絡資訊，會觸發 SMS/Push 等通知。
- Notification payload 包含 ticket_number、ticket_sequence、appointmentId（若有）。

技術指南（物件設計）
- 需操作的資料表：
  - `CHECKIN`, `VISIT_CALL`, `PATIENT`
- 需調用的方法：
  - `NotificationService.pushToDesk(roomId, payload)`（WebSocket / MQ）
  - `NotificationService.notifyPatientViaSMS(patientId, message)`（非同步）
  - `CheckinService.notifyDesk(callRecord)`
- 特殊邏輯說明：
  - Notification 為非同步處理，使用 MQ（至少一次）並提供去重（idempotency）或確認機制。
  - 應避免在主交易中等待通知結果；以事件方式在 COMMIT 後發佈。

---

### Story D-6: RoomDay 管理：每日序號重置與一致性 (Daily Reset & RoomDay)

User Story 標題
- RoomDay Daily Reset — reset next_sequence at 00:00 safely

Acceptance Criteria
- 每日 00:00 為每個 room 建立當日 `ROOM_DAY` 記錄或將 next_sequence 安全初始化（避免與同日報到 race）。
- 在 reset 與正在進行的 checkin 並發時，不會造成序號回滾或重複。

技術指南（物件設計）
- 需操作的資料表：
  - `ROOM_DAY`
- 需調用的方法：
  - `RoomDayService.ensureDayExists(roomId, date)`（idempotent）
  - `DailyJob.createRoomDayForAllRooms()`（00:00 排程）
- 特殊邏輯說明：
  - 建議以每日新增 row（room_id, date 為唯一）方式，使用 `INSERT ... ON CONFLICT DO NOTHING`，避免更新造成 race。
  - 若 checkin 發現今日 row 不存在，checkin 端可嘗試建立（INSERT ... ON CONFLICT RETURNING）再 SELECT ... FOR UPDATE。
  - 若採 reset（UPDATE）策略，須確保在低流量時間或使用 partition/maintenance window。

---

## 附註與交付建議
- 上述 12 個故事覆蓋 SDD 中指定的核心流程：預約（API 驗證、Service 鎖定、候補、過號懲罰、班表管理）與報到/候診（身份驗證、序號分配、叫號/跳號、插隊、通知、RoomDay daily reset）。
- 下一步（可選）：我可以把每個 Story 寫成 repository markdown 檔（例如 `stories/C-1-create-appointment-api.md`）並建立對應 Issue/PR 草稿；或依驗收標準產出 Postman collection / API contract / 基礎單元測試草稿。請告訴我你要哪一項。
