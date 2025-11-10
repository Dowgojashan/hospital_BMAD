# 專案啟動方式 
1️⃣ 安裝套件
在專案根目錄下執行：
npm install
2️⃣ 啟動開發伺服器
npm run dev
3️⃣ 開啟瀏覽器
開啟瀏覽器並前往：
http://localhost:5173/
即可進入掛號系統首頁。

# 目前系統進度（2025/11 更新）

| 模組 | 狀態 | 說明 |
|------|------|------|
| 🏠 系統架構建立 | ✅ 完成 | 已配置 Vite + React + Tailwind 環境 |
| 👩‍⚕️ 病患介面 (Patient UI) | 🧭 進行中 | 預計完成基本掛號與查詢頁面 |
| 👨‍⚕️ 醫師介面 (Doctor UI) | ⏳ 尚未開始 | 預計整合病歷與掛號清單 |
| 🛠️ 管理員介面 (Admin UI) | ⏳ 尚未開始 | 預計負責帳號與科別管理 |
| 🔐 路由設定 | ✅ 完成 | 已設定 React Router 基礎架構 |
| 🎨 UI 設計 | 🧭 進行中 | 採用白底卡片樣式，後續持續優化 |
| 🧾 API 串接 | ⏳ 尚未開始 | 待後端接口確立後接入 |


# 專案結構
hospital-frontend/
├── public/               # 靜態資源
├── src/
│   ├── components/       # 共用元件
│   ├── pages/            # 各角色頁面
│   ├── router/           # React Router 設定
│   ├── assets/           # 圖片、樣式資源
│   └── main.jsx          # 入口檔
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
