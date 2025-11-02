# System Architecture Plan

版本: 1.0

最後更新: 2025-11-02

摘要
----
此文件基於已確認的後端技術選型（FastAPI / SQLAlchemy / PostgreSQL）與現有 SDD 要求，補完並整合三個關鍵領域：

1. 前端技術堆疊（Frontend Tech Stack）
2. 測試策略（Testing Strategy）
3. 部署與容器化（Deployment & Containerization）

目標是給開發團隊一份可執行的、互相匹配且一致的系統架構計畫，作為從 MVP 到生產迭代的參考。

---

## 1. 前端技術堆疊 (Frontend Tech Stack)

目標考量：團隊要能快速對接 FastAPI 提供的 REST 與 WebSocket，並在桌面與行動裝置上提供流暢 UI/UX。首要優先：開發速度、社群支援、生態整合（fetch/real-time）與可維護性。

推薦總覽（MVP）：
- JavaScript 框架：React（建議）
- Bundler / Dev Tooling：Vite
- 狀態管理：React Query (TanStack Query) + Zustand（或 Redux Toolkit）
- 樣式方案：Tailwind CSS（搭配 Headless UI / Radix 之元件）
- API 客戶端：Axios（底層） + React Query 作為資料同步/快取/重試層
- WebSocket：原生 WebSocket 或 react-use-websocket（輕量）

選型理由與整合性說明
- React vs Vue：推薦 React。
  - 原因：React 在生態系（React Query, Vite, Tailwind, testing-library, Playwright/Cypress 等）與企業採用度上具明顯優勢；與 FastAPI 的 REST 與 WebSocket 互動沒有技術阻礙。
  - React 的函式式元件 + hooks（useEffect、custom hooks）非常適合實作 WebSocket reconnect 與 subscription 模式（例如候診推播、叫號即時更新）。
  - 如果團隊已有 Vue 專長且偏好 Composition API，也可選 Vue 3 + Pinia — 但以長期生態擴展與第三方工具整合來看，React 為最保險的 MVP 選擇。

- 狀態管理：
  - 推薦使用 React Query (TanStack Query) 處理「server state」（APIs、cache、retry、background refetch、pagination），這能將大量同步細節與錯誤處理從全局 state 解耦。
  - 對於本地 UI state（modals、form state、即時 client-side flags），選擇輕量的 Zustand；若偏好嚴格結構與工具支持，可選 Redux Toolkit。

- 樣式方案：
  - 推薦 Tailwind CSS：迅速建立可重複的設計系統、低 CSS 污染、與大型團隊容易維護。搭配 Headless UI 或 Radix 提供可存取性的 UI primitives。
  - 若設計團隊需要 CSS-in-JS，則可考慮 Styled-Components（配合 Storybook）— 但 Tailwind 對於 MVP 的速度與一致性更優。

- API 客戶端與 realtime：
  - 使用 Axios 做為底層 HTTP 客戶端（攔截器、認證 header、重試策略），並用 React Query 包裝為 hooks（useAppointments, useCheckin等）。
  - WebSocket：使用原生 WebSocket 或 react-use-websocket 做自動重連、心跳與消息分發。避免使用 Socket.IO（需服務端支援 socket.io 專屬協議）。

前端專案建議架構（簡要）：

```
client/
├─ src/
│  ├─ api/               # axios instance, api client wrappers
│  ├─ hooks/             # react-query hooks, websocket hooks
│  ├─ stores/            # zustand or redux slices
│  ├─ components/
│  ├─ pages/
│  ├─ styles/            # tailwind config
│  └─ utils/
├─ public/
└─ vite.config.ts

```

可選庫清單（MVP）：
- React, react-dom
- Vite
- axios, @tanstack/react-query
- zustand 或 @reduxjs/toolkit
- tailwindcss, postcss, autoprefixer
- react-use-websocket 或自製 WebSocket hook
- testing: vitest + @testing-library/react + msw (mock service worker)
- e2e: Playwright（或 Cypress）

---

## 2. 測試策略 (Testing Strategy)

整體原則：測試分為 Unit / Integration / E2E 層級，CI pipeline 自動執行。Backend 與 Frontend 測試策略需互補，避免重複且確保端到端可靠性。

2.1 後端測試（pytest 為主）

結構與工具
- pytest, pytest-asyncio
- httpx (AsyncClient) for API tests
- factory_boy or pytest fixtures for test data
- testcontainers 或 docker-compose (CI 時) 提供 PostgreSQL + RabbitMQ/Redis 的測試環境
- Coverage: coverage.py

測試類型與具體策略
- Unit Tests
  - 範圍：Service 層的純邏輯、工具函式、domain rules
  - 技術：mock repository 與外部 API（使用 pytest-mock / unittest.mock），使測試快速且 deterministic。
  - 目標：每個 service function 有至少一個 happy path 與 1-2 edge cases。

- Integration Tests (含資料庫)
  - 範圍：Repository 與 DB 互動、migration correctness、以及 service 與 repository 的協作。
  - 技術方案 A（CI-friendly）：使用 Testcontainers 套件在 CI 中啟動臨時 Postgres 與 RabbitMQ，執行 Alembic migration，然後跑測試。
  - 技術方案 B（本地 dev）：使用 docker-compose services (postgres, rabbitmq) 並提供 pytest fixture 來建立 clean schema（每個測試段落用 transaction rollback 或 truncate）。
  - 注意事項：在 integration tests 中避免依賴外部第三方（如外部通知服務），可以用 local mock 或 dockerized stub。

- API Tests (HTTP layer)
  - 範圍：Controller → Service → Repository 路徑，使用 FastAPI TestClient 或 httpx AsyncClient。
  - 建議：測試以 httpx AsyncClient 與 pytest-asyncio 執行，並在每個測試套件啟動 test Postgres（via testcontainers）或使用 transactional fixtures。
  - 測試要覆蓋主要 use-cases：reserve appointment (including locking behavior simulated), cancel schedule, checkin and room_day sequence allocation.

CI pipeline 建議步驟（GitHub Actions）
1. Lint (flake8) + format check (black --check)
2. Unit tests (pytest) 快速通過
3. Integration & API tests using testcontainers (or spin up docker-compose) — run in separate job with service containers
4. Coverage upload & gating (最低 coverage threshold 可視情況設定)

2.2 前端測試（基於 React）

工具建議
- Unit Testing：Vitest + @testing-library/react
- Mocking：msw (Mock Service Worker) 以攔截 REST / WebSocket 請求
- E2E：Playwright（建議）或 Cypress

測試類型與具體策略
- Unit Tests
  - 元件：使用 @testing-library/react 驗證 DOM 與互動行為（不 rely on implementation details）。
  - hooks：測試 custom hooks（例如 useAppointment）可使用 react-hooks-testing-library 或直接在 components 測試中涵蓋。
  - 建議 coverage：重點元件 > 80%。

- Integration Tests (Client-side)
  - 使用 msw 模擬 API 回應，測試資料流與 React Query 行為（cache、retry、refetch）。
  - 驗證 WebSocket hooks：可模擬 websocket server 或使用 msw websocket 支援測試消息分發。

- E2E Tests
  - Playwright：模擬真實使用者流程（建立預約、報到、叫號流程），在 CI 中使用 headless 模式執行。
  - 建議在 E2E 中也啟動一個可測試的後端（docker-compose or staging deploy），以驗證端到端流程與 DB 互動。

CI pipeline（frontend）
1. Install deps, run lint (eslint) & format (prettier)
2. Run unit tests (vitest)
3. Build static bundle (vite build)
4. E2E: run Playwright tests against test environment or staging deployment

共享測試建議
- API contract / schema 變更應伴隨 integration tests 與 e2e 更新。
- 在 PR 中要求測試新增/更新涵蓋變更點。

---

## 3. 部署與容器化 (Deployment & Containerization)

目標 SLA：99.9%（目標包含應用層、資料庫與 messaging），並在 MVP 階段選擇成本/可運營性平衡的方案。

3.1 容器化實務（Local 開發與 Dockerfile 最佳實踐）

Local 開發：docker-compose
- 建議使用 `docker-compose.yml` 組成開發環境：services: web, worker, postgres, redis (or rabbitmq), pgadmin。
- docker-compose 能讓開發者快速啟動環境並用相同方式執行 integration tests。

Dockerfile（FastAPI, multi-stage 範例，最佳實踐）

```dockerfile
# ---- build stage ----
FROM python:3.11-slim AS builder
WORKDIR /app
ENV PATH="/root/.local/bin:$PATH"
COPY pyproject.toml poetry.lock /app/
RUN apt-get update && apt-get install -y build-essential gcc libpq-dev --no-install-recommends \
  && pip install --upgrade pip setuptools wheel \
  && pip install poetry && poetry config virtualenvs.create false && poetry install --no-dev --no-interaction
COPY . /app

# ---- final stage ----
FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1
ENV POETRY_VIRTUALENVS_CREATE=false
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=builder /app /app

# Create non-root user
RUN useradd --create-home appuser && chown -R appuser /app
USER appuser

CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "-b", "0.0.0.0:8000", "app.main:app"]
```

說明/最佳實務：
- 使用 multi-stage build 以減少映像大小並避免在 final image 中包含編譯工具。
- 使用非 root 使用者執行容器。
- 把密碼/機密放在環境變數管理，並在生產使用 KMS/secret manager。
- 針對需要的 OS library（例如 libpq-dev）只在 build 階段安裝。

3.2 FastAPI 運行方式（生產建議）
- 建議使用 Gunicorn + Uvicorn workers：
  - 範例啟動：
    gunicorn -k uvicorn.workers.UvicornWorker -w ${WEB_CONCURRENCY:-4} -b 0.0.0.0:8000 app.main:app
  - 說明：Gunicorn 負責 process 管理，Uvicorn worker 處理 async requests。調整 worker 數目根據 CPU 與工作型態（I/O-bound 大於 CPU-bound）。
- 或使用 Uvicorn 的 process manager 如 uvicorn --workers，但 Gunicorn+Uvicorn 為常見穩定組合。
- 在 container orchestration（ECS / K8s）中，建議啟用 readiness/liveness probes，避免流量導到未就緒的 pod。

3.3 本地 docker-compose 範例（簡要）

```
version: '3.8'
services:
  web:
    build: .
    env_file: .env.dev
    ports:
      - '8000:8000'
    depends_on:
      - db
      - redis
  worker:
    build: .
    command: celery -A app.worker worker --loglevel=info
    depends_on:
      - db
      - redis
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data
  redis:
    image: redis:7
volumes:
  pgdata:

```

3.4 生產部署建議（MVP 與 99.9% SLA）

總體建議（MVP）：採用混合 managed services + container orchestration（降低運維成本、提升可靠度）
- 建議組合（MVP 最穩健路徑）：
  - Database: Managed PostgreSQL（AWS RDS Multi-AZ / Google Cloud SQL / Azure Database），開啟自動備份與 point-in-time recovery。
  - Message Queue: Managed RabbitMQ (CloudAMQP / AWS MQ) 或使用 Redis Streams (managed Redis e.g., AWS Elasticache)；選 RabbitMQ 若已實作 AMQP 功能。
  - App Runtime: Deploy containers to a managed container platform: AWS ECS (Fargate) 或 Cloud Run / Render / Heroku 與 autoscaling；若資源與團隊允許，Kubernetes (EKS / GKE / AKS) 為長期可擴展選項。
  - Load Balancer / Ingress: Use cloud load balancer (ALB / Cloud Load Balancer) + HTTPS (TLS) with certificates managed by cloud provider。
  - Observability: Hosted Prometheus/Grafana or CloudWatch + Sentry for errors, ELK / Loki for logs.

選擇理由
- Managed DB & MQ：由於 SLA 與運維風險，使用 Managed Services 能快速達到 99.9% 而不需投入大量自建運維技能（高可用配置、備援、備份、安全性 patch）。
- Container runtime：對於 MVP，選擇 ECS Fargate / Cloud Run / Render 可以快速上線，並支援 autoscaling 與簡易 CI/CD；Kubernetes（EKS/GKE/AKS）更適合預期快速成長的團隊，需投入更多 SRE 能力。

3.5 生產運行實務

- 健康檢查：設定 readiness/liveness endpoints（/healthz, /ready）; Load balancer 僅在 readiness 為 true 時導流。
- Horizontal scaling：在 CPU/Latency/Queue length thresholds 時啟用 autoscaling（ECS Fargate 或 HPA in K8s）。
- DB & MQ HA：Managed DB 開啟 Multi-AZ；Master/Replica 與自動故障切換；Managed MQ 提供 HA cluster。
- Backups & DR：每日備份 + 每週快照 + 定期恢復演練；若需要 RTO 更低，設計跨區域備援（跨區 read replica + failover runbook）。
- Secrets：使用 Secret Manager（AWS Secrets Manager / Azure Key Vault / GCP Secret Manager）與 IAM role 授權。

3.6 Logging, Metrics, Alerting

- Logging: JSON structured logs via Python logging, 集中到 ELK / Loki / Cloud Logging；保留策略與索引設計。
- Metrics: instrument FastAPI with Prometheus client, export metrics (request duration, queue length, failed jobs)；配置 Grafana dashboards。
- Tracing & Errors: Sentry for exception aggregation; distributed tracing (OpenTelemetry) 結合 Jaeger 或 cloud provider tracing。
- Alerting: 設定 SLO/SLA 監控（錯誤率、latency、DB connections），並建立 PagerDuty / Opsgenie alerting routes。

3.7 CI/CD pipeline（高階）

- GitHub Actions pipelines:
  1. push/PR: run linters, unit tests (backend & frontend)
  2. build image (on merge to main): run integration test job (testcontainers) then build and push image to registry
  3. deploy job: deploy to staging -> run smoke tests -> promote to production (manual approval)

3.8 災難復原（DR）與運維 playbooks

- Runbook: 針對常見故障（DB failover, worker backlog spike, high error rate）撰寫步驟化處理流程。
- RTO/RPO 目標：MVP 目標設置 RTO <= 1 hour, RPO <= 15 minutes（視業務需求可調）。

---

## 4. 安全建議（概要）

- 網路：強制 TLS，內部網路使用私有子網；負載平衡器處理 HTTPS。
- 認證：OAuth2 / JWT，access token 短期有效，refresh token 安全儲存與 revoke 機制。
- 最小權限：各服務使用最小權限 IAM role 存取資料庫與 message queue。
- PII：所有 PII 在寫入前視情況加密（card_number），並在日誌中遮蔽。
- 依從性：如需符合醫療資料保護（地區法規），進一步檢查加密/審計與資料駐留要求。

---

## 5. 交付項與下一步建議

短期（立即）:
- 建立 repo skeleton（app/ 與 client/）與示範 Dockerfile、docker-compose；加入 CI pipeline 基礎（lint + unit tests）。
- 實作 correlation_id middleware、基本 exception handlers 與 logging filter。

中期（MVP 發布前）:
- 在 staging 上部署 managed DB 與 MQ；執行整合測試、壓力測試（預約高併發、報到高併發），驗證鎖定與序號分配策略。
- 建立 observability dashboards 與告警。

長期（後續優化）:
- 若流量與團隊規模擴張，規劃從 managed container (Fargate) 過渡到 Kubernetes，以支援更細粒度的部署控制與自動化策略。

---

附錄：相關命令範例

建立並啟動本地 dev（docker-compose）：

```powershell
docker-compose up --build
```

執行 unit tests（backend）：

```powershell
pytest tests/unit
```

執行 API tests（使用 testcontainers 或本地 postgres）：

```powershell
pytest tests/integration -k api
```

部署（CI 範例）：build image -> push to registry -> deploy to ECS/Cloud Run

```powershell
# build image
docker build -t registry.example.com/project/hospital:{{GITHUB_SHA}} .
# push
docker push registry.example.com/project/hospital:{{GITHUB_SHA}}
```

---

文件結束。
